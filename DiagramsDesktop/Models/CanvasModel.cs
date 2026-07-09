namespace DiagramsDesktop.Models;

public class CanvasModel
{
    public string CanvasID { get; set; } = "";
    public string CanvasName { get; set; } = "My Canvas";
    public string BackgroundColor { get; set; } = "#f1f5f9";
    public string CoordinateSystemType { get; set; } = "Cartesian";
    public string OriginDefinition { get; set; } = "Center";
    public string AxisOrientationX { get; set; } = "Right";
    public string AxisOrientationY { get; set; } = "Down";
    public string AxisOrientationZ { get; set; } = "In";
    public bool IsInfiniteX { get; set; } = true;
    public bool IsInfiniteY { get; set; } = true;
    public bool IsInfiniteZ { get; set; } = true;
    public double ViewportCenterX { get; set; } = 0;
    public double ViewportCenterY { get; set; } = 0;
    public double ViewportWidth { get; set; } = 2000;
    public double ViewportHeight { get; set; } = 2000;
    public double ZoomScale { get; set; } = 1.0;
    public bool GridVisible { get; set; } = true;
    public string GridColor { get; set; } = "#94a3b8";
    public double GridSpacingX { get; set; } = 25;
    public double GridSpacingY { get; set; } = 25;
    public bool ShowOriginMarker { get; set; } = true;
    public bool ShowAxes { get; set; } = true;
    public bool PanEnabled { get; set; } = true;
    public bool ZoomEnabled { get; set; } = true;
    public string UpdatedAt { get; set; } = DateTime.UtcNow.ToString("o");
}
