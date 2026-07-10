using System;
using System.Collections.Generic;

namespace DiagramsDesktop.Core.Models
{
    public class DiagramCanvasDto
    {
        // Diagram fields
        public string? DiagramID { get; set; }
        public string? DiagramName { get; set; }
        public int DiagramVersion { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedAt { get; set; }

        // Canvas fields
        public string? CanvasID { get; set; }
        public string? CanvasName { get; set; }
        public string? BackgroundColor { get; set; }
        public string? CoordinateSystemType { get; set; }
        public string? OriginDefinition { get; set; }
        public string? AxisOrientationX { get; set; }
        public string? AxisOrientationY { get; set; }
        public string? AxisOrientationZ { get; set; }
        public bool IsInfiniteX { get; set; }
        public bool IsInfiniteY { get; set; }
        public bool IsInfiniteZ { get; set; }
        public double ViewportCenterX { get; set; }
        public double ViewportCenterY { get; set; }
        public double ViewportWidth { get; set; }
        public double ViewportHeight { get; set; }
        public double ZoomScale { get; set; }
        public bool GridVisible { get; set; }
        public string? GridColor { get; set; }
        public double GridSpacingX { get; set; }
        public double GridSpacingY { get; set; }
        public bool ShowOriginMarker { get; set; }
        public bool ShowAxes { get; set; }
        public bool PanEnabled { get; set; }
        public bool ZoomEnabled { get; set; }

        // Child Collections
        public List<ShapeDto> Shapes { get; set; } = new();
        public List<ConnectionDto> Connections { get; set; } = new();
        public List<CircleOnContainerDto> CircleOnContainers { get; set; } = new();
    }

    public class ShapeDto
    {
        public string? ShapeID { get; set; }
        public string? Type { get; set; }
        public string? Label { get; set; }
        public double WorldX { get; set; }
        public double WorldY { get; set; }
        public double Width { get; set; }
        public double Height { get; set; }
        public string? Color { get; set; }
        public string? StrokeColor { get; set; }
        public string? FillColor { get; set; }
        public string? SvgIcon { get; set; }
        public bool IsDeleted { get; set; }
        public double Radius { get; set; }
        public int ZOrder { get; set; }
        public string? FillType { get; set; }
        public string? LineType { get; set; }
        public double LineWidth { get; set; }
        public double HoverPaddingRadiusRatio { get; set; }
        public string? HoverPaddingColor { get; set; }
        public double ProtectionPaddingRadiusRatio { get; set; }
        public string? ProtectionPaddingColor { get; set; }
        public string? ParentContainerID { get; set; }
        public string? DiagramID { get; set; }
    }

    public class ConnectionDto
    {
        public string? ConnectionID { get; set; }
        public string? DiagramID { get; set; }
        public string? SourceItemID { get; set; }
        public string? SourceItemKind { get; set; }
        public string? DestinationItemID { get; set; }
        public string? DestinationItemKind { get; set; }
        public string? ConnectionType { get; set; }
        public bool IsDeleted { get; set; }
    }

    public class CircleOnContainerDto
    {
        public string? CircleOnContainerID { get; set; }
        public string? DiagramID { get; set; }
        public string? ParentContainerID { get; set; }
        public string? DeviceOnContainerEdgeType { get; set; }
        public string? ParentContainerType { get; set; }
        public string? HostEdge { get; set; }
        public double EdgeParameterT { get; set; }
        public double CenterX { get; set; }
        public double CenterY { get; set; }
        public double Radius { get; set; }
        public int ZOrder { get; set; }
        public string? FillType { get; set; }
        public string? FillColor { get; set; }
        public string? LineType { get; set; }
        public string? LineColor { get; set; }
        public double LineWidth { get; set; }
        public double HoverPaddingRadiusRatio { get; set; }
        public double ProtectionPaddingRadiusRatio { get; set; }
        public bool MovementEnabled { get; set; }
        public bool CornerTransitionEnabled { get; set; }
        public string? EdgePlacementPolicy { get; set; }
        public string? BorderOcclusionPolicy { get; set; }
        public string? RadiusConstraintSource { get; set; }
        public bool RadiusResizeEnabled { get; set; }
        public double MinimumRadiusRatio { get; set; }
        public double MaximumRadiusRatio { get; set; }
        public string? Label { get; set; }
        public string? SvgIcon { get; set; }
        public bool IsDeleted { get; set; }
        public string? CreatedAt { get; set; }
        public string? UpdatedAt { get; set; }
    }
}
