using Microsoft.Data.Sqlite;
using System.IO;

namespace DiagramsDesktop.Core.Repositories
{
    public class DiagramDbInitializer
    {
        private readonly string _connectionString;

        public DiagramDbInitializer(string connectionString)
        {
            _connectionString = connectionString;
        }

        public void InitializeDatabase()
        {
            // Extract the database file path from the connection string to ensure directories exist
            var builder = new SqliteConnectionStringBuilder(_connectionString);
            var dbPath = builder.DataSource;
            
            if (dbPath != ":memory:" && !string.IsNullOrEmpty(dbPath))
            {
                var directory = Path.GetDirectoryName(Path.GetFullPath(dbPath));
                if (!string.IsNullOrEmpty(directory))
                {
                    Directory.CreateDirectory(directory);
                }
            }

            using var connection = new SqliteConnection(_connectionString);
            connection.Open();

            // Create Diagrams table
            var createDiagramsTable = @"
                CREATE TABLE IF NOT EXISTS Diagrams (
                    DiagramID TEXT PRIMARY KEY,
                    DiagramName TEXT,
                    DiagramVersion INTEGER,
                    CanvasID TEXT,
                    CreatedAt TEXT,
                    UpdatedAt TEXT,
                    IsDeleted INTEGER DEFAULT 0
                );";

            // Create DiagramCanvases table
            var createCanvasesTable = @"
                CREATE TABLE IF NOT EXISTS DiagramCanvases (
                    CanvasID TEXT PRIMARY KEY,
                    DiagramID TEXT,
                    CanvasName TEXT,
                    BackgroundColor TEXT,
                    CoordinateSystemType TEXT,
                    OriginDefinition TEXT,
                    AxisOrientationX TEXT,
                    AxisOrientationY TEXT,
                    AxisOrientationZ TEXT,
                    IsInfiniteX INTEGER,
                    IsInfiniteY INTEGER,
                    IsInfiniteZ INTEGER,
                    ViewportCenterX REAL,
                    ViewportCenterY REAL,
                    ViewportWidth REAL,
                    ViewportHeight REAL,
                    ZoomScale REAL,
                    GridVisible INTEGER,
                    GridColor TEXT,
                    GridSpacingX REAL,
                    GridSpacingY REAL,
                    ShowOriginMarker INTEGER,
                    ShowAxes INTEGER,
                    PanEnabled INTEGER,
                    ZoomEnabled INTEGER,
                    UpdatedAt TEXT
                );";

            // Create DiagramShapes table
            var createShapesTable = @"
                CREATE TABLE IF NOT EXISTS DiagramShapes (
                    ShapeID TEXT PRIMARY KEY,
                    Type TEXT,
                    Label TEXT,
                    WorldX REAL,
                    WorldY REAL,
                    Width REAL,
                    Height REAL,
                    Color TEXT,
                    StrokeColor TEXT,
                    FillColor TEXT,
                    SvgIcon TEXT,
                    IsDeleted INTEGER DEFAULT 0,
                    Radius REAL,
                    ZOrder INTEGER,
                    FillType TEXT,
                    LineType TEXT,
                    LineWidth REAL,
                    HoverPaddingRadiusRatio REAL,
                    HoverPaddingColor TEXT,
                    ProtectionPaddingRadiusRatio REAL,
                    ProtectionPaddingColor TEXT,
                    ParentContainerID TEXT,
                    DiagramID TEXT
                );";

            // Create DiagramConnections table
            var createConnectionsTable = @"
                CREATE TABLE IF NOT EXISTS DiagramConnections (
                    ConnectionID TEXT PRIMARY KEY,
                    DiagramID TEXT,
                    SourceItemID TEXT,
                    SourceItemKind TEXT,
                    DestinationItemID TEXT,
                    DestinationItemKind TEXT,
                    ConnectionType TEXT,
                    IsDeleted INTEGER DEFAULT 0
                );";

            // Create CircleOnContainers table
            var createCircleOnContainersTable = @"
                CREATE TABLE IF NOT EXISTS CircleOnContainers (
                    CircleOnContainerID TEXT PRIMARY KEY,
                    DiagramID TEXT,
                    ParentContainerID TEXT,
                    DeviceOnContainerEdgeType TEXT,
                    ParentContainerType TEXT,
                    HostEdge TEXT,
                    EdgeParameterT REAL,
                    CenterX REAL,
                    CenterY REAL,
                    Radius REAL,
                    ZOrder INTEGER,
                    FillType TEXT,
                    FillColor TEXT,
                    LineType TEXT,
                    LineColor TEXT,
                    LineWidth REAL,
                    HoverPaddingRadiusRatio REAL,
                    ProtectionPaddingRadiusRatio REAL,
                    MovementEnabled INTEGER,
                    CornerTransitionEnabled INTEGER,
                    EdgePlacementPolicy TEXT,
                    BorderOcclusionPolicy TEXT,
                    RadiusConstraintSource TEXT,
                    RadiusResizeEnabled INTEGER,
                    MinimumRadiusRatio REAL,
                    MaximumRadiusRatio REAL,
                    Label TEXT,
                    SvgIcon TEXT,
                    IsDeleted INTEGER DEFAULT 0,
                    CreatedAt TEXT,
                    UpdatedAt TEXT
                );";

            using var cmd1 = new SqliteCommand(createDiagramsTable, connection);
            cmd1.ExecuteNonQuery();

            using var cmd2 = new SqliteCommand(createCanvasesTable, connection);
            cmd2.ExecuteNonQuery();

            using var cmd3 = new SqliteCommand(createShapesTable, connection);
            cmd3.ExecuteNonQuery();

            using var cmd4 = new SqliteCommand(createConnectionsTable, connection);
            cmd4.ExecuteNonQuery();

            using var cmd5 = new SqliteCommand(createCircleOnContainersTable, connection);
            cmd5.ExecuteNonQuery();
        }
    }
}
