using System;
using System.IO;
using System.Linq;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;
using DiagramsDesktop.Data;
using DiagramsDesktop.Models;
using DiagramsDesktop.Services;

namespace DiagramsDesktop.Tests;

public class PersistenceTests : IDisposable
{
    private readonly string _tempJsonPath;
    private readonly SqliteConnection _sqliteConnection;
    private readonly DbContextOptions<DiagramDbContext> _dbOptions;

    public PersistenceTests()
    {
        // Setup temp JSON path
        _tempJsonPath = Path.Combine(Path.GetTempPath(), Guid.NewGuid().ToString() + ".json");

        // Setup SQLite in-memory connection and DB options
        _sqliteConnection = new SqliteConnection("DataSource=:memory:");
        _sqliteConnection.Open();

        _dbOptions = new DbContextOptionsBuilder<DiagramDbContext>()
            .UseSqlite(_sqliteConnection)
            .Options;

        // Initialize schema
        using var context = new DiagramDbContext(_dbOptions);
        context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        if (File.Exists(_tempJsonPath))
        {
            File.Delete(_tempJsonPath);
        }
        _sqliteConnection.Close();
        _sqliteConnection.Dispose();
    }

    private DiagramModel CreateSampleDiagram()
    {
        var diagram = new DiagramModel
        {
            DiagramID = Guid.NewGuid().ToString(),
            DiagramName = "Test Diagram",
            DiagramVersion = 1,
            Canvas = new CanvasModel
            {
                CanvasID = Guid.NewGuid().ToString(),
                CanvasName = "Test Canvas",
                BackgroundColor = "#ffffff",
                ZoomScale = 1.25,
                GridSpacingX = 50,
                GridSpacingY = 50
            }
        };

        diagram.CanvasID = diagram.Canvas.CanvasID;

        // Add a shape
        var shape = new ShapeModel
        {
            ShapeID = Guid.NewGuid().ToString(),
            DiagramID = diagram.DiagramID,
            Type = "Rectangle",
            Label = "Test Rectangle",
            WorldX = 100,
            WorldY = -200,
            Width = 120,
            Height = 80,
            Color = "#ff0000"
        };
        diagram.Shapes.Add(shape);

        // Add a connection
        var connection = new ConnectionModel
        {
            ConnectionID = Guid.NewGuid().ToString(),
            DiagramID = diagram.DiagramID,
            SourceItemID = shape.ShapeID,
            SourceItemKind = "Shape",
            DestinationItemID = "dest-id",
            DestinationItemKind = "Shape",
            ConnectionType = "Direct"
        };
        diagram.Connections.Add(connection);

        return diagram;
    }

    [Fact]
    public void Test_JsonPersistence_SaveAndLoad()
    {
        var service = new JsonPersistenceService();
        var original = CreateSampleDiagram();

        // Save
        service.SaveToFile(original, _tempJsonPath);
        Assert.True(File.Exists(_tempJsonPath));

        // Load
        var loaded = service.LoadFromFile(_tempJsonPath);
        Assert.NotNull(loaded);
        Assert.Equal(original.DiagramID, loaded.DiagramID);
        Assert.Equal(original.DiagramName, loaded.DiagramName);
        Assert.Equal(original.Canvas.CanvasID, loaded.Canvas.CanvasID);
        Assert.Equal(original.Canvas.ZoomScale, loaded.Canvas.ZoomScale);

        Assert.Single(loaded.Shapes);
        Assert.Equal(original.Shapes[0].ShapeID, loaded.Shapes[0].ShapeID);
        Assert.Equal(original.Shapes[0].Label, loaded.Shapes[0].Label);

        Assert.Single(loaded.Connections);
        Assert.Equal(original.Connections[0].ConnectionID, loaded.Connections[0].ConnectionID);
    }

    [Fact]
    public void Test_DatabasePersistence_CRUD()
    {
        var service = new DatabasePersistenceService(_dbOptions);
        var original = CreateSampleDiagram();

        // 1. Save (Create)
        service.SaveDiagram(original);

        // 2. List
        var diagrams = service.ListDiagrams();
        Assert.Single(diagrams);
        Assert.Equal(original.DiagramID, diagrams[0].DiagramID);
        Assert.Equal("Test Diagram", diagrams[0].DiagramName);

        // 3. Load
        var loaded = service.LoadDiagram(original.DiagramID);
        Assert.NotNull(loaded);
        Assert.Equal(original.DiagramID, loaded.DiagramID);
        Assert.Equal(original.Canvas.CanvasID, loaded.Canvas.CanvasID);
        Assert.Equal(1.25, loaded.Canvas.ZoomScale);
        Assert.Single(loaded.Shapes);
        Assert.Equal("Test Rectangle", loaded.Shapes[0].Label);
        Assert.Single(loaded.Connections);

        // 4. Update (Modify existing, add shape, remove shape)
        loaded.DiagramName = "Updated Diagram Name";
        
        // Update shape label
        loaded.Shapes[0].Label = "Modified Rectangle";

        // Add a new shape
        var newShape = new ShapeModel
        {
            ShapeID = Guid.NewGuid().ToString(),
            DiagramID = loaded.DiagramID,
            Type = "Circle",
            Label = "New Circle",
            WorldX = 300,
            WorldY = 300,
            Width = 60,
            Height = 60
        };
        loaded.Shapes.Add(newShape);

        // Remove the connection
        loaded.Connections.Clear();

        service.SaveDiagram(loaded);

        // 5. Reload and Verify Updates
        var reloaded = service.LoadDiagram(original.DiagramID);
        Assert.NotNull(reloaded);
        Assert.Equal("Updated Diagram Name", reloaded.DiagramName);
        
        // Should have 2 active shapes
        Assert.Equal(2, reloaded.Shapes.Count);
        var shape1 = reloaded.Shapes.First(s => s.ShapeID == original.Shapes[0].ShapeID);
        Assert.Equal("Modified Rectangle", shape1.Label);

        var shape2 = reloaded.Shapes.First(s => s.ShapeID == newShape.ShapeID);
        Assert.Equal("New Circle", shape2.Label);

        // Connections should be empty
        Assert.Empty(reloaded.Connections);

        // Verify soft-deleted items still exist in database but have IsDeleted = 1
        using (var dbContext = new DiagramDbContext(_dbOptions))
        {
            var softDeletedConn = dbContext.DiagramConnections.IgnoreQueryFilters()
                .FirstOrDefault(c => c.ConnectionID == original.Connections[0].ConnectionID);
            Assert.NotNull(softDeletedConn);
            Assert.Equal(1, softDeletedConn.IsDeleted);
        }

        // 6. Delete
        service.DeleteDiagram(original.DiagramID);
        var listedAfterDelete = service.ListDiagrams();
        Assert.Empty(listedAfterDelete);

        var loadedAfterDelete = service.LoadDiagram(original.DiagramID);
        Assert.Null(loadedAfterDelete);
    }
}
