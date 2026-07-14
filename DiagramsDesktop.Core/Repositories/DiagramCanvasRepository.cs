using Dapper;
using Microsoft.Data.Sqlite;
using DiagramsDesktop.Core.Models;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;

namespace DiagramsDesktop.Core.Repositories
{
    public interface IDiagramCanvasRepository
    {
        Task<DiagramCanvasDto?> GetDiagramAsync(string diagramId);
        Task SaveDiagramAsync(DiagramCanvasDto dto);
        Task<IEnumerable<DiagramSummaryDto>> ListDiagramsAsync();
    }

    public class DiagramCanvasRepository : IDiagramCanvasRepository
    {
        private readonly string _connectionString;

        public DiagramCanvasRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        private IDbConnection CreateConnection() => new SqliteConnection(_connectionString);

        public async Task<DiagramCanvasDto?> GetDiagramAsync(string diagramId)
        {
            using var connection = CreateConnection();
            
            // 1. Get the Diagram metadata
            var diagramSql = "SELECT * FROM Diagrams WHERE DiagramID = @DiagramID AND IsDeleted = 0";
            var diagram = await connection.QueryFirstOrDefaultAsync<DiagramCanvasDto>(diagramSql, new { DiagramID = diagramId });
            if (diagram == null) return null;

            // 2. Get Canvas settings
            var canvasSql = "SELECT * FROM DiagramCanvases WHERE DiagramID = @DiagramID";
            var canvas = await connection.QueryFirstOrDefaultAsync<DiagramCanvasDto>(canvasSql, new { DiagramID = diagramId });
            if (canvas != null)
            {
                // Map canvas properties to the flat DTO
                diagram.CanvasID = canvas.CanvasID;
                diagram.CanvasName = canvas.CanvasName;
                diagram.BackgroundColor = canvas.BackgroundColor;
                diagram.CoordinateSystemType = canvas.CoordinateSystemType;
                diagram.OriginDefinition = canvas.OriginDefinition;
                diagram.AxisOrientationX = canvas.AxisOrientationX;
                diagram.AxisOrientationY = canvas.AxisOrientationY;
                diagram.AxisOrientationZ = canvas.AxisOrientationZ;
                diagram.IsInfiniteX = canvas.IsInfiniteX;
                diagram.IsInfiniteY = canvas.IsInfiniteY;
                diagram.IsInfiniteZ = canvas.IsInfiniteZ;
                diagram.ViewportCenterX = canvas.ViewportCenterX;
                diagram.ViewportCenterY = canvas.ViewportCenterY;
                diagram.ViewportWidth = canvas.ViewportWidth;
                diagram.ViewportHeight = canvas.ViewportHeight;
                diagram.ZoomScale = canvas.ZoomScale;
                diagram.GridVisible = canvas.GridVisible;
                diagram.GridColor = canvas.GridColor;
                diagram.GridSpacingX = canvas.GridSpacingX;
                diagram.GridSpacingY = canvas.GridSpacingY;
                diagram.ShowOriginMarker = canvas.ShowOriginMarker;
                diagram.ShowAxes = canvas.ShowAxes;
                diagram.PanEnabled = canvas.PanEnabled;
                diagram.ZoomEnabled = canvas.ZoomEnabled;
            }

            // 3. Get child collections
            var shapesSql = "SELECT * FROM DiagramShapes WHERE DiagramID = @DiagramID AND IsDeleted = 0";
            var connectionsSql = "SELECT * FROM DiagramConnections WHERE DiagramID = @DiagramID AND IsDeleted = 0";
            var cocSql = "SELECT * FROM CircleOnContainers WHERE DiagramID = @DiagramID AND IsDeleted = 0";
            var assetsSql = "SELECT * FROM SvgAssets WHERE DiagramID = @DiagramID";
            var attachmentsSql = "SELECT * FROM SvgAttachments WHERE DiagramID = @DiagramID";
 
            var shapes = await connection.QueryAsync<ShapeDto>(shapesSql, new { DiagramID = diagramId });
            var connections = await connection.QueryAsync<ConnectionDto>(connectionsSql, new { DiagramID = diagramId });
            var cocs = await connection.QueryAsync<CircleOnContainerDto>(cocSql, new { DiagramID = diagramId });
            var assets = await connection.QueryAsync<SvgAssetDto>(assetsSql, new { DiagramID = diagramId });
            var attachments = await connection.QueryAsync<SvgAttachmentDto>(attachmentsSql, new { DiagramID = diagramId });
 
            var connectionList = connections.ToList();
            if (connectionList.Any())
            {
                var detailsSql = "SELECT * FROM DiagramConnectionDetails WHERE ConnectionID IN (SELECT ConnectionID FROM DiagramConnections WHERE DiagramID = @DiagramID AND IsDeleted = 0)";
                var details = await connection.QueryAsync<ConnectionDetailDto>(detailsSql, new { DiagramID = diagramId });
                var detailsDict = details.ToDictionary(d => d.ConnectionID!);
                foreach (var conn in connectionList)
                {
                    if (conn.ConnectionID != null && detailsDict.TryGetValue(conn.ConnectionID, out var detail))
                    {
                        conn.Detail = detail;
                    }
                }
            }
 
            diagram.Shapes = shapes.ToList();
            diagram.Connections = connectionList;
            diagram.CircleOnContainers = cocs.ToList();
            diagram.SvgAssets = assets.ToList();
            diagram.SvgAttachments = attachments.ToList();
 
            return diagram;
        }

        public async Task SaveDiagramAsync(DiagramCanvasDto dto)
        {
            if (string.IsNullOrEmpty(dto.DiagramID))
                throw new ArgumentException("DiagramID cannot be null or empty during Save.");

            if (string.IsNullOrEmpty(dto.CanvasID))
                dto.CanvasID = Guid.NewGuid().ToString();

            using var connection = CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var nowStr = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");
                dto.UpdatedAt = nowStr;

                // 1. Save or Update Diagrams
                var currentVersion = await connection.ExecuteScalarAsync<int?>(
                    "SELECT DiagramVersion FROM Diagrams WHERE DiagramID = @DiagramID",
                    new { dto.DiagramID }, transaction);

                bool diagramExists = currentVersion.HasValue;

                if (diagramExists)
                {
                    // Server owns the version — always auto-increment so clients cannot spoof it
                    dto.DiagramVersion = currentVersion!.Value + 1;

                    var updateDiagramSql = @"
                        UPDATE Diagrams 
                        SET DiagramName = @DiagramName, DiagramVersion = @DiagramVersion, CanvasID = @CanvasID, UpdatedAt = @UpdatedAt 
                        WHERE DiagramID = @DiagramID";
                    await connection.ExecuteAsync(updateDiagramSql, dto, transaction);
                }
                else
                {
                    dto.CreatedAt = nowStr;
                    dto.DiagramVersion = 1; // Server owns the initial version
                    var insertDiagramSql = @"
                        INSERT INTO Diagrams (DiagramID, DiagramName, DiagramVersion, CanvasID, CreatedAt, UpdatedAt, IsDeleted)
                        VALUES (@DiagramID, @DiagramName, @DiagramVersion, @CanvasID, @CreatedAt, @UpdatedAt, 0)";
                    await connection.ExecuteAsync(insertDiagramSql, dto, transaction);
                }

                // 2. Save or Update DiagramCanvases
                var canvasExists = await connection.ExecuteScalarAsync<int>(
                    "SELECT COUNT(1) FROM DiagramCanvases WHERE CanvasID = @CanvasID",
                    new { dto.CanvasID }, transaction) > 0;

                if (canvasExists)
                {
                    var updateCanvasSql = @"
                        UPDATE DiagramCanvases 
                        SET DiagramID = @DiagramID, CanvasName = @CanvasName, BackgroundColor = @BackgroundColor,
                            CoordinateSystemType = @CoordinateSystemType, OriginDefinition = @OriginDefinition,
                            AxisOrientationX = @AxisOrientationX, AxisOrientationY = @AxisOrientationY, AxisOrientationZ = @AxisOrientationZ,
                            IsInfiniteX = @IsInfiniteX, IsInfiniteY = @IsInfiniteY, IsInfiniteZ = @IsInfiniteZ,
                            ViewportCenterX = @ViewportCenterX, ViewportCenterY = @ViewportCenterY,
                            ViewportWidth = @ViewportWidth, ViewportHeight = @ViewportHeight, ZoomScale = @ZoomScale,
                            GridVisible = @GridVisible, GridColor = @GridColor, GridSpacingX = @GridSpacingX, GridSpacingY = @GridSpacingY,
                            ShowOriginMarker = @ShowOriginMarker, ShowAxes = @ShowAxes, PanEnabled = @PanEnabled, ZoomEnabled = @ZoomEnabled,
                            UpdatedAt = @UpdatedAt
                        WHERE CanvasID = @CanvasID";
                    await connection.ExecuteAsync(updateCanvasSql, dto, transaction);
                }
                else
                {
                    var insertCanvasSql = @"
                        INSERT INTO DiagramCanvases (
                            CanvasID, DiagramID, CanvasName, BackgroundColor, CoordinateSystemType, OriginDefinition,
                            AxisOrientationX, AxisOrientationY, AxisOrientationZ, IsInfiniteX, IsInfiniteY, IsInfiniteZ,
                            ViewportCenterX, ViewportCenterY, ViewportWidth, ViewportHeight, ZoomScale,
                            GridVisible, GridColor, GridSpacingX, GridSpacingY, ShowOriginMarker, ShowAxes, PanEnabled, ZoomEnabled, UpdatedAt
                        ) VALUES (
                            @CanvasID, @DiagramID, @CanvasName, @BackgroundColor, @CoordinateSystemType, @OriginDefinition,
                            @AxisOrientationX, @AxisOrientationY, @AxisOrientationZ, @IsInfiniteX, @IsInfiniteY, @IsInfiniteZ,
                            @ViewportCenterX, @ViewportCenterY, @ViewportWidth, @ViewportHeight, @ZoomScale,
                            @GridVisible, @GridColor, @GridSpacingX, @GridSpacingY, @ShowOriginMarker, @ShowAxes, @PanEnabled, @ZoomEnabled, @UpdatedAt
                        )";
                    await connection.ExecuteAsync(insertCanvasSql, dto, transaction);
                }

                await connection.ExecuteAsync("DELETE FROM DiagramShapes WHERE DiagramID = @DiagramID", new { dto.DiagramID }, transaction);
                await connection.ExecuteAsync("DELETE FROM DiagramConnectionDetails WHERE ConnectionID IN (SELECT ConnectionID FROM DiagramConnections WHERE DiagramID = @DiagramID)", new { dto.DiagramID }, transaction);
                await connection.ExecuteAsync("DELETE FROM DiagramConnections WHERE DiagramID = @DiagramID", new { dto.DiagramID }, transaction);
                await connection.ExecuteAsync("DELETE FROM CircleOnContainers WHERE DiagramID = @DiagramID", new { dto.DiagramID }, transaction);
                await connection.ExecuteAsync("DELETE FROM SvgAssets WHERE DiagramID = @DiagramID", new { dto.DiagramID }, transaction);
                await connection.ExecuteAsync("DELETE FROM SvgAttachments WHERE DiagramID = @DiagramID", new { dto.DiagramID }, transaction);

                // 4. Insert shapes
                if (dto.Shapes != null && dto.Shapes.Any())
                {
                    var insertShapeSql = @"
                        INSERT INTO DiagramShapes (
                            ShapeID, Type, Label, WorldX, WorldY, Width, Height, Color, StrokeColor, FillColor, SvgIcon,
                            IsDeleted, Radius, ZOrder, FillType, LineType, LineWidth, HoverPaddingRadiusRatio, HoverPaddingColor,
                            ProtectionPaddingRadiusRatio, ProtectionPaddingColor, ParentContainerID, DiagramID
                        ) VALUES (
                            @ShapeID, @Type, @Label, @WorldX, @WorldY, @Width, @Height, @Color, @StrokeColor, @FillColor, @SvgIcon,
                            @IsDeleted, @Radius, @ZOrder, @FillType, @LineType, @LineWidth, @HoverPaddingRadiusRatio, @HoverPaddingColor,
                            @ProtectionPaddingRadiusRatio, @ProtectionPaddingColor, @ParentContainerID, @DiagramID
                        )";
                    await connection.ExecuteAsync(insertShapeSql, dto.Shapes, transaction);
                }

                // 5. Insert connections
                if (dto.Connections != null && dto.Connections.Any())
                {
                    var insertConnectionSql = @"
                        INSERT INTO DiagramConnections (
                            ConnectionID, DiagramID, SourceItemID, SourceItemKind, DestinationItemID, DestinationItemKind, ConnectionType, IsDeleted
                        ) VALUES (
                            @ConnectionID, @DiagramID, @SourceItemID, @SourceItemKind, @DestinationItemID, @DestinationItemKind, @ConnectionType, @IsDeleted
                        )";
                    await connection.ExecuteAsync(insertConnectionSql, dto.Connections, transaction);

                    var connectionDetails = dto.Connections
                        .Where(c => c.Detail != null)
                        .Select(c => {
                            c.Detail!.ConnectionID = c.ConnectionID;
                            return c.Detail;
                        })
                        .ToList();

                    if (connectionDetails.Any())
                    {
                        var insertDetailSql = @"
                            INSERT INTO DiagramConnectionDetails (
                                ConnectionID, LineType, LineWidth, LineColor, IsDirectional, ConnectionRouteType,
                                StartJunctionID, StartJunctionX, StartJunctionY, EndJunctionID, EndJunctionX, EndJunctionY,
                                SourceJunctionText, DestinationJunctionText, MiddleLineText
                            ) VALUES (
                                @ConnectionID, @LineType, @LineWidth, @LineColor, @IsDirectional, @ConnectionRouteType,
                                @StartJunctionID, @StartJunctionX, @StartJunctionY, @EndJunctionID, @EndJunctionX, @EndJunctionY,
                                @SourceJunctionText, @DestinationJunctionText, @MiddleLineText
                            )";
                        await connection.ExecuteAsync(insertDetailSql, connectionDetails, transaction);
                    }
                }

                // 6. Insert circle-on-containers
                if (dto.CircleOnContainers != null && dto.CircleOnContainers.Any())
                {
                    var insertCocSql = @"
                        INSERT INTO CircleOnContainers (
                            CircleOnContainerID, DiagramID, ParentContainerID, DeviceOnContainerEdgeType, ParentContainerType, HostEdge,
                            EdgeParameterT, CenterX, CenterY, Radius, ZOrder, FillType, FillColor, LineType, LineColor, LineWidth,
                            HoverPaddingRadiusRatio, ProtectionPaddingRadiusRatio, MovementEnabled, CornerTransitionEnabled,
                            EdgePlacementPolicy, BorderOcclusionPolicy, RadiusConstraintSource, RadiusResizeEnabled,
                            MinimumRadiusRatio, MaximumRadiusRatio, Label, SvgIcon, IsDeleted, CreatedAt, UpdatedAt
                        ) VALUES (
                            @CircleOnContainerID, @DiagramID, @ParentContainerID, @DeviceOnContainerEdgeType, @ParentContainerType, @HostEdge,
                            @EdgeParameterT, @CenterX, @CenterY, @Radius, @ZOrder, @FillType, @FillColor, @LineType, @LineColor, @LineWidth,
                            @HoverPaddingRadiusRatio, @ProtectionPaddingRadiusRatio, @MovementEnabled, @CornerTransitionEnabled,
                            @EdgePlacementPolicy, @BorderOcclusionPolicy, @RadiusConstraintSource, @RadiusResizeEnabled,
                            @MinimumRadiusRatio, @MaximumRadiusRatio, @Label, @SvgIcon, @IsDeleted, @CreatedAt, @UpdatedAt
                        )";
                    await connection.ExecuteAsync(insertCocSql, dto.CircleOnContainers, transaction);
                }

                // 7. Insert SvgAssets
                if (dto.SvgAssets != null && dto.SvgAssets.Any())
                {
                    var insertAssetSql = @"
                        INSERT INTO SvgAssets (
                            AssetID, DiagramID, AssetName, RawSvgContent, CreatedAt, UpdatedAt
                        ) VALUES (
                            @AssetID, @DiagramID, @AssetName, @RawSvgContent, @CreatedAt, @UpdatedAt
                        )";
                    await connection.ExecuteAsync(insertAssetSql, dto.SvgAssets, transaction);
                }

                // 8. Insert SvgAttachments
                if (dto.SvgAttachments != null && dto.SvgAttachments.Any())
                {
                    var insertAttachmentSql = @"
                        INSERT INTO SvgAttachments (
                            AttachmentID, DiagramID, AssetID, HostShapeID, FittingType,
                            ScaleX, ScaleY, OffsetX, OffsetY, ZOrder, CreatedAt, UpdatedAt
                        ) VALUES (
                            @AttachmentID, @DiagramID, @AssetID, @HostShapeID, @FittingType,
                            @ScaleX, @ScaleY, @OffsetX, @OffsetY, @ZOrder, @CreatedAt, @UpdatedAt
                        )";
                    await connection.ExecuteAsync(insertAttachmentSql, dto.SvgAttachments, transaction);
                }
 
                transaction.Commit();
            }
            catch (Exception)
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<IEnumerable<DiagramSummaryDto>> ListDiagramsAsync()
        {
            using var connection = CreateConnection();
            var sql = "SELECT DiagramID, DiagramName, DiagramVersion, CreatedAt, UpdatedAt FROM Diagrams WHERE IsDeleted = 0 ORDER BY UpdatedAt DESC";
            return await connection.QueryAsync<DiagramSummaryDto>(sql);
        }
    }
}
