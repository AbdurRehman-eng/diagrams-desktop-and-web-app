namespace DiagramsDesktop.Models;

public class CircleOnContainerModel
{
    public string CircleOnContainerID { get; set; } = "";
    public string DiagramID { get; set; } = "";
    public string ParentContainerID { get; set; } = "";
    public string DeviceOnContainerEdgeType { get; set; } = "Internet Gateway";
    public string ParentContainerType { get; set; } = "VPC";
    public string HostEdge { get; set; } = "Top";
    public double EdgeParameterT { get; set; } = 0.5;
    public double CenterX { get; set; } = 0.0;
    public double CenterY { get; set; } = 0.0;
    public double Radius { get; set; } = 30.0;
    public int ZOrder { get; set; } = 1;
    public string FillType { get; set; } = "SolidFill";
    public string FillColor { get; set; } = "#8b5cf6";
    public string LineType { get; set; } = "SolidLine";
    public string LineColor { get; set; } = "#7c3aed";
    public double LineWidth { get; set; } = 2.0;
    public double HoverPaddingRadiusRatio { get; set; } = 0.10;
    public double ProtectionPaddingRadiusRatio { get; set; } = 0.20;
    public int MovementEnabled { get; set; } = 1;
    public int CornerTransitionEnabled { get; set; } = 1;
    public string EdgePlacementPolicy { get; set; } = "CenterOnBoundary";
    public string BorderOcclusionPolicy { get; set; } = "OpaqueFill";
    public string RadiusConstraintSource { get; set; } = "GlobalVariables";
    public int RadiusResizeEnabled { get; set; } = 1;
    public double MinimumRadiusRatio { get; set; } = 0.10;
    public double MaximumRadiusRatio { get; set; } = 0.20;
    public string? Label { get; set; }
    public string? SvgIcon { get; set; }
    public int IsDeleted { get; set; } = 0;
    public string CreatedAt { get; set; } = "0001-01-01 00:00:00";
    public string UpdatedAt { get; set; } = "0001-01-01 00:00:00";
}
