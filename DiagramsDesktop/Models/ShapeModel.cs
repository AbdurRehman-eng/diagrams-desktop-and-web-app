namespace DiagramsDesktop.Models;

public class ShapeModel
{
    public string ShapeID { get; set; } = "";
    public string Type { get; set; } = "";
    public string Label { get; set; } = "";
    public double WorldX { get; set; } = 0;
    public double WorldY { get; set; } = 0;
    public double Width { get; set; } = 100;
    public double Height { get; set; } = 100;
    public string Color { get; set; } = "#6366f1";
    public string StrokeColor { get; set; } = "#6366f1";
    public string FillColor { get; set; } = "#6366f1";
    public string SvgIcon { get; set; } = "";
    public int IsDeleted { get; set; } = 0;
    public double? Radius { get; set; }
    public int ZOrder { get; set; } = 0;
    public string? FillType { get; set; }
    public string? LineType { get; set; }
    public double? LineWidth { get; set; }
    public double? HoverPaddingRadiusRatio { get; set; }
    public string? HoverPaddingColor { get; set; }
    public double? ProtectionPaddingRadiusRatio { get; set; }
    public string? ProtectionPaddingColor { get; set; }
    public string? ParentContainerID { get; set; }
    public string DiagramID { get; set; } = "";
}
