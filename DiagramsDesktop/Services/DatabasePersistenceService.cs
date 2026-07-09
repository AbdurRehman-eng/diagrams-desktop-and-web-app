using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using DiagramsDesktop.Data;
using DiagramsDesktop.Models;

namespace DiagramsDesktop.Services;

public class DatabasePersistenceService
{
    private readonly DbContextOptions<DiagramDbContext> _dbOptions;

    public DatabasePersistenceService()
    {
        string appData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        string folder = Path.Combine(appData, "DiagramsDesktop");
        Directory.CreateDirectory(folder);
        string dbPath = Path.Combine(folder, "diagrams.db");

        var builder = new DbContextOptionsBuilder<DiagramDbContext>();
        builder.UseSqlite($"Data Source={dbPath}");
        _dbOptions = builder.Options;

        using var context = new DiagramDbContext(_dbOptions);
        context.Database.EnsureCreated();
    }

    public DatabasePersistenceService(DbContextOptions<DiagramDbContext> dbOptions)
    {
        _dbOptions = dbOptions;
    }

    private DiagramDbContext CreateContext() => new DiagramDbContext(_dbOptions);

    public List<DiagramModel> ListDiagrams()
    {
        using var context = CreateContext();
        return context.Diagrams
            .Where(d => d.IsDeleted == 0)
            .ToList();
    }

    public DiagramModel? LoadDiagram(string diagramId)
    {
        if (string.IsNullOrWhiteSpace(diagramId)) return null;

        using var context = CreateContext();
        var diagram = context.Diagrams
            .Where(d => d.DiagramID == diagramId && d.IsDeleted == 0)
            .SingleOrDefault();

        if (diagram == null) return null;

        // Load Canvas
        diagram.Canvas = context.DiagramCanvases
            .FirstOrDefault(c => c.DiagramID == diagramId) ?? new CanvasModel();

        // Load Shapes
        diagram.Shapes = context.DiagramShapes
            .Where(s => s.DiagramID == diagramId && s.IsDeleted == 0)
            .ToList();

        // Load Connections
        diagram.Connections = context.DiagramConnections
            .Where(c => c.DiagramID == diagramId && c.IsDeleted == 0)
            .ToList();

        // Load CircleOnContainers
        diagram.CircleOnContainers = context.CircleOnContainers
            .Where(c => c.DiagramID == diagramId && c.IsDeleted == 0)
            .ToList();

        return diagram;
    }

    public void SaveDiagram(DiagramModel diagram)
    {
        if (diagram == null) throw new ArgumentNullException(nameof(diagram));
        if (string.IsNullOrWhiteSpace(diagram.DiagramID))
        {
            diagram.DiagramID = Guid.NewGuid().ToString();
        }

        using var context = CreateContext();
        using var transaction = context.Database.BeginTransaction();

        try
        {
            var existingDiagram = context.Diagrams.Find(diagram.DiagramID);
            if (existingDiagram == null)
            {
                // INSERT NEW DIAGRAM
                diagram.CreatedAt = DateTime.UtcNow.ToString("o");
                diagram.UpdatedAt = DateTime.UtcNow.ToString("o");
                context.Diagrams.Add(diagram);

                // Set Canvas properties
                if (diagram.Canvas != null)
                {
                    if (string.IsNullOrWhiteSpace(diagram.Canvas.CanvasID))
                    {
                        diagram.Canvas.CanvasID = Guid.NewGuid().ToString();
                    }
                    diagram.Canvas.DiagramID = diagram.DiagramID;
                    diagram.CanvasID = diagram.Canvas.CanvasID;
                    context.DiagramCanvases.Add(diagram.Canvas);
                }

                // Add shapes, connections, COCs
                foreach (var s in diagram.Shapes)
                {
                    s.DiagramID = diagram.DiagramID;
                    if (string.IsNullOrWhiteSpace(s.ShapeID)) s.ShapeID = Guid.NewGuid().ToString();
                    context.DiagramShapes.Add(s);
                }

                foreach (var c in diagram.Connections)
                {
                    c.DiagramID = diagram.DiagramID;
                    if (string.IsNullOrWhiteSpace(c.ConnectionID)) c.ConnectionID = Guid.NewGuid().ToString();
                    context.DiagramConnections.Add(c);
                }

                foreach (var coc in diagram.CircleOnContainers)
                {
                    coc.DiagramID = diagram.DiagramID;
                    if (string.IsNullOrWhiteSpace(coc.CircleOnContainerID)) coc.CircleOnContainerID = Guid.NewGuid().ToString();
                    context.CircleOnContainers.Add(coc);
                }
            }
            else
            {
                // UPDATE EXISTING DIAGRAM
                existingDiagram.DiagramName = diagram.DiagramName;
                existingDiagram.DiagramVersion = diagram.DiagramVersion;
                existingDiagram.UpdatedAt = DateTime.UtcNow.ToString("o");
                context.Entry(existingDiagram).State = EntityState.Modified;

                // Sync Canvas
                if (diagram.Canvas != null)
                {
                    var existingCanvas = context.DiagramCanvases.Find(diagram.Canvas.CanvasID);
                    if (existingCanvas == null)
                    {
                        diagram.Canvas.DiagramID = diagram.DiagramID;
                        context.DiagramCanvases.Add(diagram.Canvas);
                    }
                    else
                    {
                        context.Entry(existingCanvas).CurrentValues.SetValues(diagram.Canvas);
                        context.Entry(existingCanvas).State = EntityState.Modified;
                    }
                    existingDiagram.CanvasID = diagram.Canvas.CanvasID;
                }

                // Sync Shapes (Upsert/Delete)
                var currentShapeIds = diagram.Shapes.Select(s => s.ShapeID).ToList();
                var shapesInDb = context.DiagramShapes.Where(s => s.DiagramID == diagram.DiagramID).ToList();

                // Soft-delete shapes not present in current list
                foreach (var dbShape in shapesInDb)
                {
                    if (!currentShapeIds.Contains(dbShape.ShapeID))
                    {
                        dbShape.IsDeleted = 1;
                        context.Entry(dbShape).State = EntityState.Modified;
                    }
                }

                // Upsert current shapes
                foreach (var shape in diagram.Shapes)
                {
                    shape.DiagramID = diagram.DiagramID;
                    var dbShape = shapesInDb.FirstOrDefault(s => s.ShapeID == shape.ShapeID);
                    if (dbShape == null)
                    {
                        if (string.IsNullOrWhiteSpace(shape.ShapeID)) shape.ShapeID = Guid.NewGuid().ToString();
                        context.DiagramShapes.Add(shape);
                    }
                    else
                    {
                        context.Entry(dbShape).CurrentValues.SetValues(shape);
                        dbShape.IsDeleted = 0; // Undelete if it was deleted
                        context.Entry(dbShape).State = EntityState.Modified;
                    }
                }

                // Sync Connections
                var currentConnectionIds = diagram.Connections.Select(c => c.ConnectionID).ToList();
                var connectionsInDb = context.DiagramConnections.Where(c => c.DiagramID == diagram.DiagramID).ToList();

                foreach (var dbConn in connectionsInDb)
                {
                    if (!currentConnectionIds.Contains(dbConn.ConnectionID))
                    {
                        dbConn.IsDeleted = 1;
                        context.Entry(dbConn).State = EntityState.Modified;
                    }
                }

                foreach (var conn in diagram.Connections)
                {
                    conn.DiagramID = diagram.DiagramID;
                    var dbConn = connectionsInDb.FirstOrDefault(c => c.ConnectionID == conn.ConnectionID);
                    if (dbConn == null)
                    {
                        if (string.IsNullOrWhiteSpace(conn.ConnectionID)) conn.ConnectionID = Guid.NewGuid().ToString();
                        context.DiagramConnections.Add(conn);
                    }
                    else
                    {
                        context.Entry(dbConn).CurrentValues.SetValues(conn);
                        dbConn.IsDeleted = 0;
                        context.Entry(dbConn).State = EntityState.Modified;
                    }
                }

                // Sync CircleOnContainers
                var currentCocIds = diagram.CircleOnContainers.Select(c => c.CircleOnContainerID).ToList();
                var cocsInDb = context.CircleOnContainers.Where(c => c.DiagramID == diagram.DiagramID).ToList();

                foreach (var dbCoc in cocsInDb)
                {
                    if (!currentCocIds.Contains(dbCoc.CircleOnContainerID))
                    {
                        dbCoc.IsDeleted = 1;
                        context.Entry(dbCoc).State = EntityState.Modified;
                    }
                }

                foreach (var coc in diagram.CircleOnContainers)
                {
                    coc.DiagramID = diagram.DiagramID;
                    var dbCoc = cocsInDb.FirstOrDefault(c => c.CircleOnContainerID == coc.CircleOnContainerID);
                    if (dbCoc == null)
                    {
                        if (string.IsNullOrWhiteSpace(coc.CircleOnContainerID)) coc.CircleOnContainerID = Guid.NewGuid().ToString();
                        context.CircleOnContainers.Add(coc);
                    }
                    else
                    {
                        context.Entry(dbCoc).CurrentValues.SetValues(coc);
                        dbCoc.IsDeleted = 0;
                        context.Entry(dbCoc).State = EntityState.Modified;
                    }
                }
            }

            context.SaveChanges();
            transaction.Commit();
        }
        catch
        {
            transaction.Rollback();
            throw;
        }
    }

    public void DeleteDiagram(string diagramId)
    {
        if (string.IsNullOrWhiteSpace(diagramId)) return;

        using var context = CreateContext();
        var diagram = context.Diagrams.Find(diagramId);
        if (diagram != null)
        {
            diagram.IsDeleted = 1;
            diagram.UpdatedAt = DateTime.UtcNow.ToString("o");
            context.Entry(diagram).State = EntityState.Modified;
            context.SaveChanges();
        }
    }
}
