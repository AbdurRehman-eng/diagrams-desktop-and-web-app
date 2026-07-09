using Microsoft.EntityFrameworkCore;
using DiagramsDesktop.Models;

namespace DiagramsDesktop.Data;

public class DiagramDbContext : DbContext
{
    public DbSet<DiagramModel> Diagrams { get; set; } = null!;
    public DbSet<CanvasModel> DiagramCanvases { get; set; } = null!;
    public DbSet<ShapeModel> DiagramShapes { get; set; } = null!;
    public DbSet<ConnectionModel> DiagramConnections { get; set; } = null!;
    public DbSet<CircleOnContainerModel> CircleOnContainers { get; set; } = null!;

    public DiagramDbContext()
    {
    }

    public DiagramDbContext(DbContextOptions<DiagramDbContext> options)
        : base(options)
    {
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            // Default path for development/local execution
            string dbPath = System.IO.Path.Combine(System.AppDomain.CurrentDomain.BaseDirectory, "diagrams.db");
            optionsBuilder.UseSqlite($"Data Source={dbPath}");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Diagrams table
        modelBuilder.Entity<DiagramModel>(entity =>
        {
            entity.ToTable("Diagrams");
            entity.HasKey(e => e.DiagramID);

            // One-to-One: DiagramModel -> CanvasModel
            entity.HasOne(d => d.Canvas)
                  .WithOne()
                  .HasForeignKey<CanvasModel>(c => c.DiagramID) // DiagramCanvases has DiagramID column
                  .HasPrincipalKey<DiagramModel>(d => d.DiagramID);
        });

        // DiagramCanvases table
        modelBuilder.Entity<CanvasModel>(entity =>
        {
            entity.ToTable("DiagramCanvases");
            entity.HasKey(e => e.CanvasID);
        });

        // DiagramShapes table
        modelBuilder.Entity<ShapeModel>(entity =>
        {
            entity.ToTable("DiagramShapes");
            entity.HasKey(e => e.ShapeID);

            // One-to-Many: DiagramModel -> ShapeModel
            entity.HasOne<DiagramModel>()
                  .WithMany(d => d.Shapes)
                  .HasForeignKey(s => s.DiagramID)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // DiagramConnections table
        modelBuilder.Entity<ConnectionModel>(entity =>
        {
            entity.ToTable("DiagramConnections");
            entity.HasKey(e => e.ConnectionID);

            // One-to-Many: DiagramModel -> ConnectionModel
            entity.HasOne<DiagramModel>()
                  .WithMany(d => d.Connections)
                  .HasForeignKey(c => c.DiagramID)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // CircleOnContainers table
        modelBuilder.Entity<CircleOnContainerModel>(entity =>
        {
            entity.ToTable("CircleOnContainers");
            entity.HasKey(e => e.CircleOnContainerID);

            // One-to-Many: DiagramModel -> CircleOnContainerModel
            entity.HasOne<DiagramModel>()
                  .WithMany(d => d.CircleOnContainers)
                  .HasForeignKey(coc => coc.DiagramID)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
