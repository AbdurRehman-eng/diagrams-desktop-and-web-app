namespace DiagramsDesktop.Models;

public static class CanvasConfig
{
    public const string DefaultCanvasName = "MainCanvasViewport";
    public const string DefaultBackgroundColor = "#f8fafc";
    public const string DefaultGridColor = "#e2e8f0";
    public const double DefaultGridSpacing = 25;

    public const double DefaultViewportWidth = 1000;
    public const double DefaultViewportHeight = 800;

    public const double MinZoom = 0.1;
    public const double MaxZoom = 5.0;
    public const double ZoomStep = 0.1;

    public const string CoordinateSystem = "CenterBasedWorld";
    public const string OriginDefinition = "Center";

    public const string AxisOrientationX = "RightPositive";
    public const string AxisOrientationY = "UpPositive";
    public const string AxisOrientationZ = "FrontPositive";

    public const bool IsInfiniteX = true;
    public const bool IsInfiniteY = true;
    public const bool IsInfiniteZ = true;

    public const int DebugUpdateIntervalMs = 100;
}
