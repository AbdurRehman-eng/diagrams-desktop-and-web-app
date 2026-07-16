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

            // Create DiagramConnectionDetails table
            var createConnectionDetailsTable = @"
                CREATE TABLE IF NOT EXISTS DiagramConnectionDetails (
                    ConnectionID TEXT PRIMARY KEY,
                    LineType TEXT,
                    LineWidth REAL,
                    LineColor TEXT,
                    IsDirectional INTEGER,
                    ConnectionRouteType TEXT,
                    StartJunctionID TEXT,
                    StartJunctionX REAL,
                    StartJunctionY REAL,
                    EndJunctionID TEXT,
                    EndJunctionX REAL,
                    EndJunctionY REAL,
                    SourceJunctionText TEXT,
                    DestinationJunctionText TEXT,
                    MiddleLineText TEXT
                );";

            // Create ConnectionStyleDefaults table
            var createConnectionStyleDefaultsTable = @"
                CREATE TABLE IF NOT EXISTS ConnectionStyleDefaults (
                    ConnectionType TEXT PRIMARY KEY,
                    StrokeColor TEXT,
                    LineType TEXT,
                    LineWidth REAL,
                    DrawArrows INTEGER,
                    TargetRadiusPaddingRatio REAL
                );";

            // Create ConnectionTypeLookups table
            var createConnectionTypeLookupsTable = @"
                CREATE TABLE IF NOT EXISTS ConnectionTypeLookups (
                    SourceDeviceType TEXT,
                    DestinationDeviceType TEXT,
                    PossibleConnections TEXT,
                    MaxConnections INTEGER,
                    PRIMARY KEY (SourceDeviceType, DestinationDeviceType)
                );";

            // Create SvgAssets table
            var createSvgAssetsTable = @"
                CREATE TABLE IF NOT EXISTS SvgAssets (
                    AssetID TEXT PRIMARY KEY,
                    DiagramID TEXT,
                    AssetName TEXT,
                    RawSvgContent TEXT,
                    CreatedAt TEXT,
                    UpdatedAt TEXT
                );";

            // Create SvgAttachments table
            var createSvgAttachmentsTable = @"
                CREATE TABLE IF NOT EXISTS SvgAttachments (
                    AttachmentID TEXT PRIMARY KEY,
                    DiagramID TEXT,
                    AssetID TEXT,
                    HostShapeID TEXT,
                    FittingType TEXT,
                    ScaleX REAL,
                    ScaleY REAL,
                    OffsetX REAL,
                    OffsetY REAL,
                    ZOrder INTEGER,
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

            using var cmd6 = new SqliteCommand(createConnectionDetailsTable, connection);
            cmd6.ExecuteNonQuery();

            using var cmd7 = new SqliteCommand(createConnectionStyleDefaultsTable, connection);
            cmd7.ExecuteNonQuery();

            using var cmd8 = new SqliteCommand(createConnectionTypeLookupsTable, connection);
            cmd8.ExecuteNonQuery();

            using var cmd9 = new SqliteCommand(createSvgAssetsTable, connection);
            cmd9.ExecuteNonQuery();

            using var cmd10 = new SqliteCommand(createSvgAttachmentsTable, connection);
            cmd10.ExecuteNonQuery();

            // Seed ConnectionStyleDefaults
            var seedStyleDefaults = @"
                INSERT OR IGNORE INTO ConnectionStyleDefaults (ConnectionType, StrokeColor, LineType, LineWidth, DrawArrows, TargetRadiusPaddingRatio) VALUES
                ('VPC to VPC', '#22c55e', 'solid', 3.0, 0, 1.0),
                ('Subnet to Subnet', '#3b82f6', 'dashed', 2.0, 0, 1.0),
                ('IPsec tunnel', '#f59e0b', 'dashed', 2.0, 0, 1.0),
                ('VPC peer link', '#000000', 'solid', 5.0, 0, 1.0),
                ('One line', '#6366f1', 'solid', 2.0, 1, 1.0),
                ('Two lines', '#6366f1', 'solid', 2.0, 1, 1.0),
                ('Three lines', '#6366f1', 'solid', 2.0, 1, 1.0),
                ('Four lines', '#6366f1', 'solid', 2.0, 1, 1.0),
                ('No choices. Solid black line', '#000000', 'solid', 2.0, 0, 1.0);";
            using var cmdStyleDefaults = new SqliteCommand(seedStyleDefaults, connection);
            cmdStyleDefaults.ExecuteNonQuery();

            // Seed ConnectionTypeLookups
            var seedLookups = @"
                INSERT OR IGNORE INTO ConnectionTypeLookups (SourceDeviceType, DestinationDeviceType, PossibleConnections, MaxConnections) VALUES
                ('Rectangle', 'Rectangle', 'One line OR Two lines OR Three lines OR Four lines', 1),
                ('Rectangle', 'Circle', 'One line OR Two lines OR Three lines OR Four lines', 1),
                ('AWS VPC', 'AWS VPC', 'IPsec tunnel OR VPC Peer link', 1),
                ('AWS Subnet', 'AWS Route table', 'No choices. Solid black line', 1),
                ('AWS Route table', 'AWS Internet Gateway', 'No choices. Solid black line', 1),
                ('AWS Route table', 'AWS NAT gateway', 'No choices. Solid black line', 1);";
            using var cmdLookups = new SqliteCommand(seedLookups, connection);
            cmdLookups.ExecuteNonQuery();
        }
    }
}
