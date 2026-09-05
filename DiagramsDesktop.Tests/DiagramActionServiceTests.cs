using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using DiagramsDesktop.Core.Services;
using DiagramsDesktop.Core.Repositories;
using Dapper;

namespace DiagramsDesktop.Tests
{
    public class DiagramActionServiceTests : IDisposable
    {
        private readonly string _dbPath;
        private readonly string _connectionString;
        private readonly DiagramDbInitializer _dbInitializer;
        private readonly DiagramActionService _service;

        public DiagramActionServiceTests()
        {
            // Set up a unique database file for each test run to ensure isolation
            _dbPath = Path.Combine(AppContext.BaseDirectory, $"actions_test_{Guid.NewGuid()}.db");
            _connectionString = $"Data Source={_dbPath}";

            _dbInitializer = new DiagramDbInitializer(_connectionString);
            _dbInitializer.InitializeDatabase();

            // Default service with entitlement function returning true
            _service = new DiagramActionService(_connectionString, (entitlement) => true);
        }

        public void Dispose()
        {
            // Clean up test database file
            if (File.Exists(_dbPath))
            {
                try
                {
                    File.Delete(_dbPath);
                }
                catch
                {
                    // Ignore locks in cleanup
                }
            }
        }

        [Fact]
        public async Task SaveReadDelete_TempActions_WorksCorrectly()
        {
            // Arrange
            var diagramId = "TEST-DGM-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
            var actionsText = "# GML AWS Temporary Action File\n001 | Create Region \"Ohio\"\n";

            // Act - Save
            await _service.SaveTempActionsAsync(diagramId, actionsText);

            // Assert - Read
            var readText = await _service.ReadTempActionsAsync(diagramId);
            Assert.Equal(actionsText, readText);

            // Act - Delete
            await _service.DeleteTempActionsAsync(diagramId);

            // Assert - Deleted
            var deletedText = await _service.ReadTempActionsAsync(diagramId);
            Assert.Equal(string.Empty, deletedText);
        }

        [Fact]
        public async Task CommitActions_WithValid22Actions_Succeeds()
        {
            // Arrange
            var diagramId = "TEST-22ACT-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
            
            // 22 actions with CIDRs added for subnets to pass validation
            var actionPlan = @"# GML AWS Temporary Action File
# Status: TEMP
# Region: Ohio
001 | Create Region ""Ohio""
002 | Create VPC ""GML-VPC-0E19F4"" inside Region ""Ohio"" with CIDR ""10.0.0.0/16""
003 | Create VPC ""GML-VPC-942B8E"" inside Region ""Ohio"" with CIDR ""10.1.0.0/16""
004 | Attach VPC Peering ""GML-PEER-96802A"" between VPC ""GML-VPC-0E19F4"" and VPC ""GML-VPC-942B8E""
005 | Create Internet Gateway ""GML-IGW-36C176"" inside Region ""Ohio""
006 | Create Internet Gateway ""GML-IGW-B38985"" inside Region ""Ohio""
007 | Attach Internet Gateway ""GML-IGW-36C176"" to VPC ""GML-VPC-0E19F4""
008 | Attach Internet Gateway ""GML-IGW-B38985"" to VPC ""GML-VPC-942B8E""
009 | Create Availability Zone ""GML-AZ-3FF231"" inside VPC ""GML-VPC-0E19F4""
010 | Create Availability Zone ""GML-AZ-8F8E66"" inside VPC ""GML-VPC-942B8E""
011 | Create Subnet ""GML-SUBNET-885BB9"" inside Availability Zone ""GML-AZ-3FF231"" of VPC ""GML-VPC-0E19F4"" with CIDR ""10.0.1.0/24""
012 | Create Subnet ""GML-SUBNET-954ACF"" inside Availability Zone ""GML-AZ-8F8E66"" of VPC ""GML-VPC-942B8E"" with CIDR ""10.1.1.0/24""
013 | Create Route Table ""GML-RT-00888F"" inside VPC ""GML-VPC-0E19F4""
014 | Create Route Table ""GML-RT-DA86D2"" inside VPC ""GML-VPC-942B8E""
015 | Attach Subnet ""GML-SUBNET-885BB9"" to Route Table ""GML-RT-00888F""
016 | Attach Subnet ""GML-SUBNET-954ACF"" to Route Table ""GML-RT-DA86D2""
017 | Attach Route Table ""GML-RT-00888F"" to Internet Gateway ""GML-IGW-36C176""
018 | Attach Route Table ""GML-RT-DA86D2"" to Internet Gateway ""GML-IGW-B38985""
019 | Create EC2 Instance ""GML-EC2-9F1860"" inside Subnet ""GML-SUBNET-885BB9""
020 | Create EC2 Instance ""GML-EC2-5E5882"" inside Subnet ""GML-SUBNET-954ACF""
021 | Create Lambda Function ""GML-LAMBDA-2F65F7"" inside Subnet ""GML-SUBNET-885BB9""
022 | Create Lambda Function ""GML-LAMBDA-F3F876"" inside Subnet ""GML-SUBNET-954ACF""";

            await _service.SaveTempActionsAsync(diagramId, actionPlan);

            // Act
            var result = await _service.CommitActionsAsync(diagramId, "TestUser");

            // Assert
            Assert.True(result.Success, $"Expected commit to succeed, but had errors: {string.Join(", ", result.ValidationErrors)}");
            Assert.NotEmpty(result.CorrelationID);
            Assert.Empty(result.ValidationErrors);
            
            // Should contain 22 executed steps (14 creations + 8 attachments)
            Assert.Equal(22, result.Steps.Count);

            // Check database to verify CommitTransactions contains COMPLETED
            using (var connection = new Microsoft.Data.Sqlite.SqliteConnection(_connectionString))
            {
                var status = await connection.QueryFirstOrDefaultAsync<string>(
                    "SELECT Status FROM CommitTransactions WHERE CorrelationID = @CorrelationID",
                    new { CorrelationID = result.CorrelationID }
                );
                Assert.Equal("COMPLETED", status);

                var logCount = await connection.QueryFirstOrDefaultAsync<int>(
                    "SELECT COUNT(*) FROM ActionAuditLogs WHERE CorrelationID = @CorrelationID",
                    new { CorrelationID = result.CorrelationID }
                );
                Assert.Equal(22, logCount);
            }

            // Temp file should be deleted on acceptance
            var readText = await _service.ReadTempActionsAsync(diagramId);
            Assert.Equal(string.Empty, readText);
        }

        [Fact]
        public async Task CommitActions_WithMissingSubnetCidrs_FailsValidation()
        {
            // Arrange
            var diagramId = "TEST-22FAIL-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();
            
            // Original 22 actions without CIDRs on subnets (lines 11, 12)
            var actionPlan = @"# GML AWS Temporary Action File
# Status: TEMP
# Region: Ohio
001 | Create Region ""Ohio""
002 | Create VPC ""GML-VPC-0E19F4"" inside Region ""Ohio"" with CIDR ""10.0.0.0/16""
003 | Create VPC ""GML-VPC-942B8E"" inside Region ""Ohio"" with CIDR ""10.1.0.0/16""
004 | Attach VPC Peering ""GML-PEER-96802A"" between VPC ""GML-VPC-0E19F4"" and VPC ""GML-VPC-942B8E""
005 | Create Internet Gateway ""GML-IGW-36C176"" inside Region ""Ohio""
006 | Create Internet Gateway ""GML-IGW-B38985"" inside Region ""Ohio""
007 | Attach Internet Gateway ""GML-IGW-36C176"" to VPC ""GML-VPC-0E19F4""
008 | Attach Internet Gateway ""GML-IGW-B38985"" to VPC ""GML-VPC-942B8E""
009 | Create Availability Zone ""GML-AZ-3FF231"" inside VPC ""GML-VPC-0E19F4""
010 | Create Availability Zone ""GML-AZ-8F8E66"" inside VPC ""GML-VPC-942B8E""
011 | Create Subnet ""GML-SUBNET-885BB9"" inside Availability Zone ""GML-AZ-3FF231"" of VPC ""GML-VPC-0E19F4""
012 | Create Subnet ""GML-SUBNET-954ACF"" inside Availability Zone ""GML-AZ-8F8E66"" of VPC ""GML-VPC-942B8E""
013 | Create Route Table ""GML-RT-00888F"" inside VPC ""GML-VPC-0E19F4""
014 | Create Route Table ""GML-RT-DA86D2"" inside VPC ""GML-VPC-942B8E""
015 | Attach Subnet ""GML-SUBNET-885BB9"" to Route Table ""GML-RT-00888F""
016 | Attach Subnet ""GML-SUBNET-954ACF"" to Route Table ""GML-RT-DA86D2""
017 | Attach Route Table ""GML-RT-00888F"" to Internet Gateway ""GML-IGW-36C176""
018 | Attach Route Table ""GML-RT-DA86D2"" to Internet Gateway ""GML-IGW-B38985""
019 | Create EC2 Instance ""GML-EC2-9F1860"" inside Subnet ""GML-SUBNET-885BB9""
020 | Create EC2 Instance ""GML-EC2-5E5882"" inside Subnet ""GML-SUBNET-954ACF""
021 | Create Lambda Function ""GML-LAMBDA-2F65F7"" inside Subnet ""GML-SUBNET-885BB9""
022 | Create Lambda Function ""GML-LAMBDA-F3F876"" inside Subnet ""GML-SUBNET-954ACF""";

            await _service.SaveTempActionsAsync(diagramId, actionPlan);

            // Act
            var result = await _service.CommitActionsAsync(diagramId, "TestUser");

            // Assert
            Assert.False(result.Success);
            Assert.NotEmpty(result.ValidationErrors);
            
            // Validation should specifically complain about syntax on line 11 and 12
            Assert.Contains(result.ValidationErrors, err => err.Contains("Line 011: Unsupported action verb or syntax"));
            Assert.Contains(result.ValidationErrors, err => err.Contains("Line 012: Unsupported action verb or syntax"));

            // Temp file must NOT be deleted on validation failure
            var readText = await _service.ReadTempActionsAsync(diagramId);
            Assert.Equal(actionPlan, readText);
        }

        [Fact]
        public async Task CommitActions_EntitlementGating_BlocksPremiumResources()
        {
            // Arrange
            var gatedService = new DiagramActionService(_connectionString, (entitlement) => false); // no entitlements
            var diagramId = "TEST-GATED-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper();

            // NAT Gateway requires premium_cloud_resources entitlement
            var actionPlan = @"# GML AWS Temporary Action File
# Status: TEMP
# Region: Ohio
001 | Create Region ""Ohio""
002 | Create VPC ""GML-VPC-0E19F4"" inside Region ""Ohio"" with CIDR ""10.0.0.0/16""
003 | Create Subnet ""GML-SUBNET-885BB9"" inside Availability Zone ""GML-AZ-3FF231"" of VPC ""GML-VPC-0E19F4"" with CIDR ""10.0.1.0/24""
004 | Create NAT Gateway ""GML-NAT-001"" inside Subnet ""GML-SUBNET-885BB9""";

            await gatedService.SaveTempActionsAsync(diagramId, actionPlan);

            // Act
            var result = await gatedService.CommitActionsAsync(diagramId, "TestUser");

            // Assert
            Assert.False(result.Success);
            Assert.Contains(result.ValidationErrors, err => err.Contains("Line 004: Your current plan does not support Premium Cloud Resources (e.g. NAT Gateway)"));
        }
    }
}
