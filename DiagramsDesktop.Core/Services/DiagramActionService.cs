using Dapper;
using Microsoft.Data.Sqlite;
using System;
using System.Collections.Generic;
using System.Data;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using DiagramsDesktop.Core.Repositories;

namespace DiagramsDesktop.Core.Services
{
    public class CommitStepLog
    {
        public string Action { get; set; } = string.Empty;
        public string GmlID { get; set; } = string.Empty;
        public string ProviderResourceID { get; set; } = string.Empty;
        public string Result { get; set; } = string.Empty;
        public string FailureReason { get; set; } = string.Empty;
        public string Timestamp { get; set; } = string.Empty;
    }

    public class CommitResult
    {
        public bool Success { get; set; }
        public string CorrelationID { get; set; } = string.Empty;
        public List<string> ValidationErrors { get; set; } = new();
        public List<CommitStepLog> Steps { get; set; } = new();
    }

    public interface IDiagramActionService
    {
        Task SaveTempActionsAsync(string diagramId, string actionsText);
        Task<string> ReadTempActionsAsync(string diagramId);
        Task DeleteTempActionsAsync(string diagramId);
        Task<CommitResult> CommitActionsAsync(string diagramId, string username);
        Task<IEnumerable<dynamic>> GetAuditLogsAsync();
    }

    public class DiagramActionService : IDiagramActionService
    {
        private readonly string _connectionString;
        private readonly string _tempFolder;

        private readonly Func<string, bool>? _hasEntitlement;

        public DiagramActionService(IDiagramCanvasRepository diagramRepo)
        {
            // Resolve connection string from the injected repository if possible
            // But since repository encapsulates it, we can resolve or pass it.
            // For MAUI program wiring, we'll initialize it in MauiProgram.cs
            _tempFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GML Diagrams", "TempActions");
            _connectionString = string.Empty; // Set dynamically
            _hasEntitlement = null;
        }

        public DiagramActionService(string connectionString)
        {
            _connectionString = connectionString;
            _hasEntitlement = null;
            _tempFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GML Diagrams", "TempActions");
            Directory.CreateDirectory(_tempFolder);
        }

        public DiagramActionService(string connectionString, Func<string, bool> hasEntitlement)
        {
            _connectionString = connectionString;
            _hasEntitlement = hasEntitlement;
            _tempFolder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "GML Diagrams", "TempActions");
            Directory.CreateDirectory(_tempFolder);
        }

        private IDbConnection CreateConnection() => new SqliteConnection(_connectionString);

        private string GetTempFilePath(string diagramId)
        {
            return Path.Combine(_tempFolder, $"DGM-{diagramId}.temp.actions");
        }

        public async Task SaveTempActionsAsync(string diagramId, string actionsText)
        {
            if (string.IsNullOrWhiteSpace(diagramId))
                throw new ArgumentException("Diagram ID cannot be empty.", nameof(diagramId));

            var filePath = GetTempFilePath(diagramId);
            var tempFilePath = filePath + ".tmp";

            // Atomic file write
            await File.WriteAllTextAsync(tempFilePath, actionsText ?? string.Empty, Encoding.UTF8);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            File.Move(tempFilePath, filePath);
        }

        public async Task<string> ReadTempActionsAsync(string diagramId)
        {
            if (string.IsNullOrWhiteSpace(diagramId))
                throw new ArgumentException("Diagram ID cannot be empty.", nameof(diagramId));

            var filePath = GetTempFilePath(diagramId);
            if (!File.Exists(filePath))
            {
                return string.Empty;
            }

            return await File.ReadAllTextAsync(filePath, Encoding.UTF8);
        }

        public Task DeleteTempActionsAsync(string diagramId)
        {
            if (string.IsNullOrWhiteSpace(diagramId))
                throw new ArgumentException("Diagram ID cannot be empty.", nameof(diagramId));

            var filePath = GetTempFilePath(diagramId);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            return Task.CompletedTask;
        }

        public async Task<CommitResult> CommitActionsAsync(string diagramId, string username)
        {
            var result = new CommitResult
            {
                CorrelationID = "TXN-" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper(),
                Success = false
            };

            var actionsText = await ReadTempActionsAsync(diagramId);
            if (string.IsNullOrWhiteSpace(actionsText))
            {
                result.ValidationErrors.Add("The temporary action plan file does not exist or is empty.");
                return result;
            }

            // 1. Parse action lines
            var lines = ParseActionLines(actionsText, out var metadata);
            
            // 2. Validate action lines
            var validationErrors = ValidateActions(lines, metadata);
            if (validationErrors.Any())
            {
                result.ValidationErrors = validationErrors;
                return result;
            }

            // 3. Persist the commit transaction as PENDING
            using (var connection = CreateConnection())
            {
                connection.Open();
                using var dbTx = connection.BeginTransaction();
                try
                {
                    var sqlTx = @"INSERT INTO CommitTransactions (CorrelationID, DiagramID, Status, ActionPlan, CreatedAt)
                                  VALUES (@CorrelationID, @DiagramID, 'PENDING', @ActionPlan, @CreatedAt)";
                    await connection.ExecuteAsync(sqlTx, new
                    {
                        CorrelationID = result.CorrelationID,
                        DiagramID = diagramId,
                        ActionPlan = actionsText,
                        CreatedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                    }, dbTx);
                    dbTx.Commit();
                }
                catch (Exception ex)
                {
                    dbTx.Rollback();
                    result.ValidationErrors.Add($"Failed to record commit transaction in database: {ex.Message}");
                    return result;
                }
            }

            // 4. Delete the temporary action file as it's now persisted in DB
            await DeleteTempActionsAsync(diagramId);

            // 5. Execute steps (in dependency order)
            var stableProviderIds = new Dictionary<string, string>(); // GmlID -> AWS ID
            var executedSteps = new List<CommitStepLog>();

            bool executionFailed = false;
            string failReason = string.Empty;

            // Separate Create and Attach lines
            var createLines = lines.Where(l => l.Type == ActionLineType.Create).ToList();
            var attachLines = lines.Where(l => l.Type == ActionLineType.Attach).ToList();

            // Order creations by resource dependency hierarchy
            var orderedCreations = OrderCreationsByHierarchy(createLines);

            // Phase 1: Execution of Creations
            foreach (var line in orderedCreations)
            {
                var stepLog = new CommitStepLog
                {
                    Action = $"Create {line.ResourceType}",
                    GmlID = line.ResourceID,
                    Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                };

                try
                {
                    // Simulated AWS provisioning call
                    string providerId = SimulateAWSProvisioning(line, stableProviderIds);
                    stableProviderIds[line.ResourceID] = providerId;
                    stepLog.ProviderResourceID = providerId;
                    stepLog.Result = "Success";
                    executedSteps.Add(stepLog);

                    await LogAuditAsync(result.CorrelationID, username, "AWS", stepLog);
                }
                catch (Exception ex)
                {
                    stepLog.Result = "Failed";
                    stepLog.FailureReason = ex.Message;
                    executedSteps.Add(stepLog);
                    
                    await LogAuditAsync(result.CorrelationID, username, "AWS", stepLog);

                    executionFailed = true;
                    failReason = ex.Message;
                    break;
                }
            }

            // Phase 2: Execution of Attachments (only if creations succeeded)
            if (!executionFailed)
            {
                foreach (var line in attachLines)
                {
                    var stepLog = new CommitStepLog
                    {
                        Action = $"Attach {line.ResourceType}",
                        GmlID = line.ResourceID,
                        Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                    };

                    try
                    {
                        // Simulated AWS attachment call
                        string providerId = SimulateAWSAttachment(line, stableProviderIds);
                        stepLog.ProviderResourceID = providerId;
                        stepLog.Result = "Success";
                        executedSteps.Add(stepLog);

                        await LogAuditAsync(result.CorrelationID, username, "AWS", stepLog);
                    }
                    catch (Exception ex)
                    {
                        stepLog.Result = "Failed";
                        stepLog.FailureReason = ex.Message;
                        executedSteps.Add(stepLog);

                        await LogAuditAsync(result.CorrelationID, username, "AWS", stepLog);

                        executionFailed = true;
                        failReason = ex.Message;
                        break;
                    }
                }
            }

            // Phase 3: Rollback on Failure
            if (executionFailed)
            {
                result.Success = false;
                result.Steps = executedSteps;

                // Rollback successfully created resources in reverse order
                var rollbackSteps = executedSteps.Where(s => s.Result == "Success").Reverse().ToList();
                foreach (var step in rollbackSteps)
                {
                    var rollbackLog = new CommitStepLog
                    {
                        Action = $"Rollback {step.Action}",
                        GmlID = step.GmlID,
                        ProviderResourceID = step.ProviderResourceID,
                        Timestamp = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss")
                    };

                    try
                    {
                        // Simulate deleting the AWS resource
                        rollbackLog.Result = "Success";
                        await LogAuditAsync(result.CorrelationID, username, "AWS", rollbackLog);
                    }
                    catch (Exception ex)
                    {
                        rollbackLog.Result = "Failed";
                        rollbackLog.FailureReason = ex.Message;
                        await LogAuditAsync(result.CorrelationID, username, "AWS", rollbackLog);
                    }
                }

                // Update commit transaction status to FAILED
                using (var connection = CreateConnection())
                {
                    var sqlTx = "UPDATE CommitTransactions SET Status = 'FAILED', CompletedAt = @CompletedAt WHERE CorrelationID = @CorrelationID";
                    await connection.ExecuteAsync(sqlTx, new { CorrelationID = result.CorrelationID, CompletedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") });
                }
            }
            else
            {
                result.Success = true;
                result.Steps = executedSteps;

                // Update commit transaction status to COMPLETED
                using (var connection = CreateConnection())
                {
                    var sqlTx = "UPDATE CommitTransactions SET Status = 'COMPLETED', CompletedAt = @CompletedAt WHERE CorrelationID = @CorrelationID";
                    await connection.ExecuteAsync(sqlTx, new { CorrelationID = result.CorrelationID, CompletedAt = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") });
                }
            }

            return result;
        }

        private async Task LogAuditAsync(string txnId, string username, string provider, CommitStepLog step)
        {
            using var connection = CreateConnection();
            var sql = @"INSERT INTO ActionAuditLogs (AuditLogID, CorrelationID, Username, Provider, Action, GmlID, ProviderResourceID, Result, FailureReason, Timestamp)
                        VALUES (@AuditLogID, @CorrelationID, @Username, @Provider, @Action, @GmlID, @ProviderResourceID, @Result, @FailureReason, @Timestamp)";
            
            await connection.ExecuteAsync(sql, new
            {
                AuditLogID = "AUD-" + Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper(),
                CorrelationID = txnId,
                Username = username,
                Provider = provider,
                Action = step.Action,
                GmlID = step.GmlID,
                ProviderResourceID = step.ProviderResourceID,
                Result = step.Result,
                FailureReason = step.FailureReason,
                Timestamp = step.Timestamp
            });
        }

        // --- Simulated AWS Adapter Methods ---
        private string SimulateAWSProvisioning(ActionLine line, Dictionary<string, string> resolvedIds)
        {
            var randHex = Guid.NewGuid().ToString("N").Substring(0, 8);
            return line.ResourceType.ToLower() switch
            {
                "region" => line.ResourceID,
                "vpc" => $"vpc-{randHex}",
                "availability zone" => $"subnet-az-zone-{randHex}",
                "subnet" => $"subnet-{randHex}",
                "route table" => $"rtb-{randHex}",
                "internet gateway" => $"igw-{randHex}",
                "nat gateway" => $"nat-{randHex}",
                "ec2 instance" => $"i-{randHex}",
                "lambda function" => $"arn:aws:lambda:region:account:function:{line.ResourceID}",
                _ => $"aws-res-{randHex}"
            };
        }

        private string SimulateAWSAttachment(ActionLine line, Dictionary<string, string> resolvedIds)
        {
            return $"attach-{Guid.NewGuid().ToString("N").Substring(0, 8)}";
        }

        // --- Parsing and Dependency Helpers ---
        private enum ActionLineType { Create, Attach }

        private class ActionLine
        {
            public int Index { get; set; }
            public ActionLineType Type { get; set; }
            public string ResourceType { get; set; } = string.Empty;
            public string ResourceID { get; set; } = string.Empty;
            public Dictionary<string, string> Parameters { get; set; } = new();
            public string RawLine { get; set; } = string.Empty;
        }

        private List<ActionLine> ParseActionLines(string text, out Dictionary<string, string> metadata)
        {
            metadata = new Dictionary<string, string>();
            var lines = new List<ActionLine>();

            var textLines = text.Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            int idx = 1;

            foreach (var rawLine in textLines)
            {
                var trimmed = rawLine.Trim();
                if (trimmed.StartsWith("#"))
                {
                    var metaMatch = Regex.Match(trimmed, @"#\s*([^:]+):\s*(.+)");
                    if (metaMatch.Success)
                    {
                        metadata[metaMatch.Groups[1].Value.Trim()] = metaMatch.Groups[2].Value.Trim();
                    }
                    continue;
                }

                var parts = trimmed.Split(new[] { '|' }, 2);
                if (parts.Length < 2) continue;

                var lineNo = int.TryParse(parts[0].Trim(), out var parsedNo) ? parsedNo : idx;
                var actionText = parts[1].Trim();

                // Regex definitions
                var createRegion = Regex.Match(actionText, @"^Create Region ""([^""]+)""", RegexOptions.IgnoreCase);
                var createVpc = Regex.Match(actionText, @"^Create VPC ""([^""]+)"" inside Region ""([^""]+)"" with CIDR ""([^""]+)""", RegexOptions.IgnoreCase);
                var createAz = Regex.Match(actionText, @"^Create Availability Zone ""([^""]+)"" inside VPC ""([^""]+)""", RegexOptions.IgnoreCase);
                var createSubnet = Regex.Match(actionText, @"^Create Subnet ""([^""]+)"" inside Availability Zone ""([^""]+)"" of VPC ""([^""]+)"" with CIDR ""([^""]+)""", RegexOptions.IgnoreCase);
                var createIgw = Regex.Match(actionText, @"^Create Internet Gateway ""([^""]+)"" inside Region ""([^""]+)""", RegexOptions.IgnoreCase);
                var createRt = Regex.Match(actionText, @"^Create Route Table ""([^""]+)"" inside VPC ""([^""]+)""", RegexOptions.IgnoreCase);
                var createEc2 = Regex.Match(actionText, @"^Create EC2 Instance ""([^""]+)"" inside Subnet ""([^""]+)""", RegexOptions.IgnoreCase);
                var createLambda = Regex.Match(actionText, @"^Create Lambda Function ""([^""]+)"" inside Subnet ""([^""]+)""", RegexOptions.IgnoreCase);
                var createNat = Regex.Match(actionText, @"^Create NAT Gateway ""([^""]+)"" inside Subnet ""([^""]+)""", RegexOptions.IgnoreCase);

                var attachPeering = Regex.Match(actionText, @"^Attach VPC Peering ""([^""]+)"" between VPC ""([^""]+)"" and VPC ""([^""]+)""", RegexOptions.IgnoreCase);
                var attachIgw = Regex.Match(actionText, @"^Attach Internet Gateway ""([^""]+)"" to VPC ""([^""]+)""", RegexOptions.IgnoreCase);
                var attachSubnet = Regex.Match(actionText, @"^Attach Subnet ""([^""]+)"" to Route Table ""([^""]+)""", RegexOptions.IgnoreCase);
                var attachRt = Regex.Match(actionText, @"^Attach Route Table ""([^""]+)"" to Internet Gateway ""([^""]+)""", RegexOptions.IgnoreCase);

                if (createRegion.Success)
                {
                    lines.Add(new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "Region", ResourceID = createRegion.Groups[1].Value, RawLine = trimmed });
                }
                else if (createVpc.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "VPC", ResourceID = createVpc.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["Region"] = createVpc.Groups[2].Value;
                    line.Parameters["CIDR"] = createVpc.Groups[3].Value;
                    lines.Add(line);
                }
                else if (createAz.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "Availability Zone", ResourceID = createAz.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["VPC"] = createAz.Groups[2].Value;
                    lines.Add(line);
                }
                else if (createSubnet.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "Subnet", ResourceID = createSubnet.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["AZ"] = createSubnet.Groups[2].Value;
                    line.Parameters["VPC"] = createSubnet.Groups[3].Value;
                    line.Parameters["CIDR"] = createSubnet.Groups[4].Value;
                    lines.Add(line);
                }
                else if (createIgw.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "Internet Gateway", ResourceID = createIgw.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["Region"] = createIgw.Groups[2].Value;
                    lines.Add(line);
                }
                else if (createRt.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "Route Table", ResourceID = createRt.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["VPC"] = createRt.Groups[2].Value;
                    lines.Add(line);
                }
                else if (createEc2.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "EC2 Instance", ResourceID = createEc2.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["Subnet"] = createEc2.Groups[2].Value;
                    lines.Add(line);
                }
                else if (createLambda.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "Lambda Function", ResourceID = createLambda.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["Subnet"] = createLambda.Groups[2].Value;
                    lines.Add(line);
                }
                else if (createNat.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "NAT Gateway", ResourceID = createNat.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["Subnet"] = createNat.Groups[2].Value;
                    lines.Add(line);
                }
                else if (attachPeering.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Attach, ResourceType = "VPC Peering", ResourceID = attachPeering.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["SourceVPC"] = attachPeering.Groups[2].Value;
                    line.Parameters["TargetVPC"] = attachPeering.Groups[3].Value;
                    lines.Add(line);
                }
                else if (attachIgw.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Attach, ResourceType = "Internet Gateway Attachment", ResourceID = attachIgw.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["VPC"] = attachIgw.Groups[2].Value;
                    lines.Add(line);
                }
                else if (attachSubnet.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Attach, ResourceType = "Subnet Association", ResourceID = attachSubnet.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["RouteTable"] = attachSubnet.Groups[2].Value;
                    lines.Add(line);
                }
                else if (attachRt.Success)
                {
                    var line = new ActionLine { Index = lineNo, Type = ActionLineType.Attach, ResourceType = "Route Table Attachment", ResourceID = attachRt.Groups[1].Value, RawLine = trimmed };
                    line.Parameters["InternetGateway"] = attachRt.Groups[2].Value;
                    lines.Add(line);
                }
                else
                {
                    // Catch-all line mapping
                    lines.Add(new ActionLine { Index = lineNo, Type = ActionLineType.Create, ResourceType = "Unknown", ResourceID = "unknown", RawLine = trimmed });
                }
                idx++;
            }

            return lines;
        }

        private List<string> ValidateActions(List<ActionLine> lines, Dictionary<string, string> metadata)
        {
            var errors = new List<string>();

            // 0. Entitlements Gating Check
            if (_hasEntitlement != null)
            {
                foreach (var line in lines)
                {
                    if (line.ResourceType == "Unknown") continue;

                    // NAT Gateway (aws-nat) requires premium_cloud_resources entitlement
                    if (string.Equals(line.ResourceType, "NAT Gateway", StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(line.ResourceType, "aws-nat", StringComparison.OrdinalIgnoreCase))
                    {
                        if (!_hasEntitlement("premium_cloud_resources"))
                        {
                            errors.Add($"Line {line.Index:D3}: Your current plan does not support Premium Cloud Resources (e.g. NAT Gateway). Please upgrade your subscription.");
                        }
                    }
                }
            }

            // 1. Verify GML IDs exist exactly once
            var ids = new Dictionary<string, int>();
            foreach (var line in lines)
            {
                if (line.ResourceType == "Unknown")
                {
                    errors.Add($"Line {line.Index:D3}: Unsupported action verb or syntax in: '{line.RawLine}'");
                    continue;
                }
                if (line.ResourceType == "Region") continue; // Region name is not a GML ID format
                if (line.Type == ActionLineType.Attach && line.ResourceType != "VPC Peering") continue; // Attach lines (except VPC Peering) reference existing IDs

                if (ids.ContainsKey(line.ResourceID))
                {
                    ids[line.ResourceID]++;
                }
                else
                {
                    ids[line.ResourceID] = 1;
                }
            }

            foreach (var kvp in ids)
            {
                if (kvp.Value > 1 && kvp.Key != "unknown")
                {
                    errors.Add($"GML Resource ID '{kvp.Key}' is defined {kvp.Value} times. Each GML ID must exist exactly once.");
                }
            }

            // Keep track of VPC to CIDR
            var vpcCidrs = new Dictionary<string, (string Cidr, uint Start, uint End)>();
            var subnets = new List<ActionLine>();
            var igwAttachments = new Dictionary<string, List<string>>(); // IGW ID -> VPC IDs

            // 2. Validate CIDRs and references
            foreach (var line in lines)
            {
                if (line.ResourceType == "VPC")
                {
                    var cidrStr = line.Parameters["CIDR"];
                    if (!TryParseCidr(cidrStr, out var start, out var end))
                    {
                        errors.Add($"Line {line.Index:D3}: VPC '{line.ResourceID}' has invalid CIDR format '{cidrStr}'");
                    }
                    else
                    {
                        vpcCidrs[line.ResourceID] = (cidrStr, start, end);
                    }
                }
                else if (line.ResourceType == "Subnet")
                {
                    subnets.Add(line);
                }
                else if (line.ResourceType == "Internet Gateway Attachment")
                {
                    var igwId = line.ResourceID;
                    var vpcId = line.Parameters["VPC"];
                    if (!igwAttachments.ContainsKey(igwId))
                    {
                        igwAttachments[igwId] = new List<string>();
                    }
                    igwAttachments[igwId].Add(vpcId);
                }
            }

            // Verify subnets CIDRs fit inside parent VPCs and do not overlap
            var subnetCidrs = new Dictionary<string, (uint Start, uint End, string ParentVpc)>();
            foreach (var sub in subnets)
            {
                var subnetId = sub.ResourceID;
                var parentVpc = sub.Parameters["VPC"];
                var cidrStr = sub.Parameters["CIDR"];

                if (!vpcCidrs.ContainsKey(parentVpc))
                {
                    errors.Add($"Line {sub.Index:D3}: Subnet '{subnetId}' refers to non-existent VPC '{parentVpc}'");
                    continue;
                }

                if (!TryParseCidr(cidrStr, out var subStart, out var subEnd))
                {
                    errors.Add($"Line {sub.Index:D3}: Subnet '{subnetId}' has invalid CIDR format '{cidrStr}'");
                    continue;
                }

                var vpc = vpcCidrs[parentVpc];
                // Check containment
                if (subStart < vpc.Start || subEnd > vpc.End)
                {
                    errors.Add($"Line {sub.Index:D3}: Subnet '{subnetId}' CIDR '{cidrStr}' does not fit inside parent VPC '{parentVpc}' CIDR '{vpc.Cidr}'");
                }

                // Check overlap with other subnets in the same VPC
                foreach (var other in subnetCidrs)
                {
                    if (other.Value.ParentVpc == parentVpc)
                    {
                        if (subStart <= other.Value.End && other.Value.Start <= subEnd)
                        {
                            errors.Add($"Line {sub.Index:D3}: Subnet '{subnetId}' CIDR '{cidrStr}' overlaps with Subnet '{other.Key}' CIDR range.");
                        }
                    }
                }

                subnetCidrs[subnetId] = (subStart, subEnd, parentVpc);
            }

            // Validate VPC Peering overlaps: Peered VPC CIDRs must not overlap
            foreach (var line in lines.Where(l => l.ResourceType == "VPC Peering"))
            {
                var srcVpc = line.Parameters["SourceVPC"];
                var dstVpc = line.Parameters["TargetVPC"];

                if (vpcCidrs.TryGetValue(srcVpc, out var src) && vpcCidrs.TryGetValue(dstVpc, out var dst))
                {
                    if (src.Start <= dst.End && dst.Start <= src.End)
                    {
                        errors.Add($"Line {line.Index:D3}: Peered VPCs '{srcVpc}' and '{dstVpc}' have overlapping CIDR ranges ('{src.Cidr}' and '{dst.Cidr}')");
                    }
                }
            }

            // Verify each Internet Gateway is attached to at most one VPC
            foreach (var kvp in igwAttachments)
            {
                if (kvp.Value.Count > 1)
                {
                    errors.Add($"Internet Gateway '{kvp.Key}' is attached to {kvp.Value.Count} VPCs ({string.Join(", ", kvp.Value)}). It must be attached to at most one VPC.");
                }
            }

            return errors;
        }

        private List<ActionLine> OrderCreationsByHierarchy(List<ActionLine> creations)
        {
            var ordered = new List<ActionLine>();

            // Hierarchy ordering: Region -> VPC -> AZ -> Subnet -> Others (Route Table, IGW, EC2, Lambda)
            var regions = creations.Where(c => c.ResourceType == "Region");
            var vpcs = creations.Where(c => c.ResourceType == "VPC");
            var azs = creations.Where(c => c.ResourceType == "Availability Zone");
            var subnets = creations.Where(c => c.ResourceType == "Subnet");
            var others = creations.Where(c => c.ResourceType != "Region" && c.ResourceType != "VPC" && c.ResourceType != "Availability Zone" && c.ResourceType != "Subnet");

            ordered.AddRange(regions);
            ordered.AddRange(vpcs);
            ordered.AddRange(azs);
            ordered.AddRange(subnets);
            ordered.AddRange(others);

            return ordered;
        }

        // --- CIDR Helper Math ---
        private bool TryParseCidr(string cidr, out uint startIp, out uint endIp)
        {
            startIp = 0;
            endIp = 0;
            if (string.IsNullOrWhiteSpace(cidr)) return false;

            var parts = cidr.Split('/');
            if (parts.Length != 2) return false;

            if (!IPAddress.TryParse(parts[0], out var ip)) return false;
            if (!int.TryParse(parts[1], out var maskBits) || maskBits < 0 || maskBits > 32) return false;

            var bytes = ip.GetAddressBytes();
            if (bytes.Length != 4) return false; // Only IPv4 is supported

            uint ipAddress = ((uint)bytes[0] << 24) | ((uint)bytes[1] << 16) | ((uint)bytes[2] << 8) | bytes[3];
            uint mask = maskBits == 0 ? 0 : 0xFFFFFFFF << (32 - maskBits);

            startIp = ipAddress & mask;
            endIp = ipAddress | ~mask;

            return true;
        }

        public async Task<IEnumerable<dynamic>> GetAuditLogsAsync()
        {
            using var connection = CreateConnection();
            var sql = "SELECT * FROM ActionAuditLogs ORDER BY Timestamp DESC LIMIT 100";
            return await connection.QueryAsync(sql);
        }
    }
}
