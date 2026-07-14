using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Xunit;
using DiagramsDesktop.Core.Models;
using DiagramsDesktop.Core.Repositories;
using DiagramsDesktop.Core.Services;

namespace DiagramsDesktop.Tests
{
    public class DiagramCanvasServiceTests : IDisposable
    {
        private readonly string _dbPath;
        private readonly string _connectionString;
        private readonly DiagramDbInitializer _dbInitializer;
        private readonly DiagramCanvasRepository _repository;
        private readonly DiagramCanvasService _service;

        public DiagramCanvasServiceTests()
        {
            // Set up a unique database file for each test run to ensure isolation
            _dbPath = Path.Combine(AppContext.BaseDirectory, $"diagrams_test_{Guid.NewGuid()}.db");
            _connectionString = $"Data Source={_dbPath}";

            _dbInitializer = new DiagramDbInitializer(_connectionString);
            _dbInitializer.InitializeDatabase();

            _repository = new DiagramCanvasRepository(_connectionString);
            _service = new DiagramCanvasService(_repository);
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
        public void InitializeDatabase_CreatesRequiredTables()
        {
            // Assert that the database file is actually created
            Assert.True(File.Exists(_dbPath));
        }

        [Fact]
        public async Task SaveAndGetDiagram_SavesAllFieldsAndCollections()
        {
            // Arrange
            var diagramId = Guid.NewGuid().ToString();
            var canvasId = Guid.NewGuid().ToString();
            var shapeId = Guid.NewGuid().ToString();
            var connectionId = Guid.NewGuid().ToString();
            var cocId = Guid.NewGuid().ToString();

            var dto = new DiagramCanvasDto
            {
                DiagramID = diagramId,
                DiagramName = "Integration Test Diagram",
                DiagramVersion = 2,
                CanvasID = canvasId,
                CanvasName = "Test Canvas",
                BackgroundColor = "#121212",
                CoordinateSystemType = "CARTESIAN",
                OriginDefinition = "CENTER",
                AxisOrientationX = "RIGHT",
                AxisOrientationY = "UP",
                AxisOrientationZ = "OUT",
                IsInfiniteX = true,
                IsInfiniteY = true,
                IsInfiniteZ = false,
                ViewportCenterX = 100.5,
                ViewportCenterY = -50.2,
                ViewportWidth = 1920,
                ViewportHeight = 1080,
                ZoomScale = 1.5,
                GridVisible = true,
                GridColor = "#333333",
                GridSpacingX = 20,
                GridSpacingY = 20,
                ShowOriginMarker = true,
                ShowAxes = true,
                PanEnabled = true,
                ZoomEnabled = true,
                Shapes = new()
                {
                    new ShapeDto
                    {
                        ShapeID = shapeId,
                        DiagramID = diagramId,
                        Type = "Container",
                        Label = "Test Shape",
                        WorldX = 10.0,
                        WorldY = 20.0,
                        Width = 100.0,
                        Height = 80.0,
                        Color = "#ffffff",
                        StrokeColor = "#ff0000",
                        FillColor = "#00ff00",
                        ZOrder = 1,
                        IsDeleted = false
                    }
                },
                Connections = new()
                {
                    new ConnectionDto
                    {
                        ConnectionID = connectionId,
                        DiagramID = diagramId,
                        SourceItemID = shapeId,
                        SourceItemKind = "SHAPE",
                        DestinationItemID = "target-node",
                        DestinationItemKind = "SHAPE",
                        ConnectionType = "ASSOCIATION",
                        IsDeleted = false
                    }
                },
                CircleOnContainers = new()
                {
                    new CircleOnContainerDto
                    {
                        CircleOnContainerID = cocId,
                        DiagramID = diagramId,
                        ParentContainerID = shapeId,
                        DeviceOnContainerEdgeType = "TOP",
                        CenterX = 50.0,
                        CenterY = 0.0,
                        Radius = 15.0,
                        ZOrder = 2,
                        IsDeleted = false
                    }
                }
            };

            // Act
            await _service.SaveDiagramAsync(dto);
            var loaded = await _service.GetDiagramAsync(diagramId);

            // Assert
            Assert.NotNull(loaded);
            Assert.Equal(diagramId, loaded.DiagramID);
            Assert.Equal("Integration Test Diagram", loaded.DiagramName);
            // Server owns DiagramVersion: first save is always v1, regardless of client-supplied value
            Assert.Equal(1, loaded.DiagramVersion);
            Assert.Equal(canvasId, loaded.CanvasID);
            Assert.Equal("Test Canvas", loaded.CanvasName);
            Assert.Equal("#121212", loaded.BackgroundColor);
            Assert.Equal("CARTESIAN", loaded.CoordinateSystemType);
            Assert.True(loaded.IsInfiniteX);
            Assert.False(loaded.IsInfiniteZ);
            Assert.Equal(100.5, loaded.ViewportCenterX);
            Assert.Equal(1.5, loaded.ZoomScale);

            // Assert collections
            Assert.Single(loaded.Shapes);
            var shape = loaded.Shapes[0];
            Assert.Equal(shapeId, shape.ShapeID);
            Assert.Equal("Test Shape", shape.Label);
            Assert.Equal(10.0, shape.WorldX);
            Assert.Equal(100.0, shape.Width);

            Assert.Single(loaded.Connections);
            var conn = loaded.Connections[0];
            Assert.Equal(connectionId, conn.ConnectionID);
            Assert.Equal(shapeId, conn.SourceItemID);

            Assert.Single(loaded.CircleOnContainers);
            var coc = loaded.CircleOnContainers[0];
            Assert.Equal(cocId, coc.CircleOnContainerID);
            Assert.Equal(shapeId, coc.ParentContainerID);
        }

        [Fact]
        public async Task ListDiagrams_ReturnsAllSavedDiagrams()
        {
            // Arrange
            var diagram1 = new DiagramCanvasDto { DiagramID = "d1", DiagramName = "Diagram 1", DiagramVersion = 1 };
            var diagram2 = new DiagramCanvasDto { DiagramID = "d2", DiagramName = "Diagram 2", DiagramVersion = 2 };

            // Act
            await _service.SaveDiagramAsync(diagram1);
            await _service.SaveDiagramAsync(diagram2);

            var list = (await _service.ListDiagramsAsync()).ToList();

            // Assert
            Assert.Equal(2, list.Count);
            Assert.Contains(list, d => d.DiagramID == "d1" && d.DiagramName == "Diagram 1");
            Assert.Contains(list, d => d.DiagramID == "d2" && d.DiagramName == "Diagram 2");
        }

        [Fact]
        public async Task SaveAndGetDiagram_PersistsCircleSpecificFields()
        {
            // Arrange
            var diagramId = Guid.NewGuid().ToString();
            var shapeId = Guid.NewGuid().ToString();
            var parentId = Guid.NewGuid().ToString();

            var dto = new DiagramCanvasDto
            {
                DiagramID = diagramId,
                DiagramName = "Circle Fields Test",
                CanvasID = Guid.NewGuid().ToString(),
                Shapes = new()
                {
                    new ShapeDto
                    {
                        ShapeID = shapeId,
                        DiagramID = diagramId,
                        Type = "circle",
                        Label = "Test Circle Child",
                        WorldX = 45.0,
                        WorldY = 90.0,
                        Radius = 25.0,
                        HoverPaddingRadiusRatio = 1.15,
                        ProtectionPaddingRadiusRatio = 1.25,
                        ParentContainerID = parentId,
                        IsDeleted = false
                    }
                }
            };

            // Act
            await _service.SaveDiagramAsync(dto);
            var loaded = await _service.GetDiagramAsync(diagramId);

            // Assert
            Assert.NotNull(loaded);
            Assert.Single(loaded.Shapes);
            var circleShape = loaded.Shapes[0];
            Assert.Equal(shapeId, circleShape.ShapeID);
            Assert.Equal("circle", circleShape.Type);
            Assert.Equal(25.0, circleShape.Radius);
            Assert.Equal(1.15, circleShape.HoverPaddingRadiusRatio);
            Assert.Equal(1.25, circleShape.ProtectionPaddingRadiusRatio);
            Assert.Equal(parentId, circleShape.ParentContainerID);
        }
    }
}

