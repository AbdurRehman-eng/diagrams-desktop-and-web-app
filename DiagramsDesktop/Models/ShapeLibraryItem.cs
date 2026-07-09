namespace DiagramsDesktop.Models;

public class ShapeLibraryItem
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "";
    public string Label { get; set; } = "";
    public string CategoryId { get; set; } = "";
    public string? ParentType { get; set; }
    public string GeometryType { get; set; } = "rectangle"; // rectangle or circle
    public bool TransparentFill { get; set; } = false;
    public string SvgIcon { get; set; } = "";
    public double DefaultWidth { get; set; } = 100;
    public double DefaultHeight { get; set; } = 100;
    public string FillColor { get; set; } = "#6366f1";
    public string StrokeColor { get; set; } = "#6366f1";
    public bool IsContainer { get; set; } = false;
    public bool IsPlaceholder { get; set; } = false;

    // Circle On Container edge-attachment properties
    public bool EdgeAttachment { get; set; } = false;
    public string? EdgeContainerType { get; set; }
    public string? BaseShapeType { get; set; }
}
