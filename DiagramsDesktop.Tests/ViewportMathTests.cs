using Xunit;
using DiagramsDesktop.Math;
using DiagramsDesktop.Models;

namespace DiagramsDesktop.Tests;

public class ViewportMathTests
{
    [Fact]
    public void CalculatePan_ReturnsCorrectDelta()
    {
        // Act
        var (dX1, dY1) = ViewportMath.CalculatePan(10, 20, 2.0);
        var (dX2, dY2) = ViewportMath.CalculatePan(-10, -20, 0.5);

        // Assert
        Assert.Equal(-5.0, dX1);
        Assert.Equal(10.0, dY1); // Y-flip: positive dY
        Assert.Equal(20.0, dX2);
        Assert.Equal(-40.0, dY2);
    }

    [Fact]
    public void CalculateZoom_ZoomIn_ReturnsNewScaleAndCenters()
    {
        // Arrange
        var canvas = new CanvasModel
        {
            ViewportCenterX = 100,
            ViewportCenterY = 200,
            ZoomScale = 1.0
        };

        // Act
        var (zoom, newVCX, newVCY) = ViewportMath.CalculateZoom(
            currentZoom: 1.0,
            direction: 1, // zoom in
            anchorScreenX: 450, // 50 pixels right of screen center (assuming width 800)
            anchorScreenY: 350, // 50 pixels down from screen center (assuming height 600)
            canvasWidth: 800,
            canvasHeight: 600,
            canvas: canvas
        );

        // Assert
        Assert.Equal(1.1, zoom); // ZOOM_STEP is 0.1
        Assert.NotNull(newVCX);
        Assert.NotNull(newVCY);
        // VC_new = VC_old + dx * (1/Zoom_old - 1/Zoom_new)
        // dx = 450 - 400 = 50
        // dy = 350 - 300 = 50
        // newVCX = 100 + 50 * (1/1.0 - 1/1.1) = 100 + 50 * (0.09090909) = 104.545454...
        Assert.Equal(100.0 + 50.0 * (1.0 - 1.0 / 1.1), newVCX.Value, precision: 5);
        // newVCY = 200 - 50 * (1/1.0 - 1/1.1) = 195.454545...
        Assert.Equal(200.0 - 50.0 * (1.0 - 1.0 / 1.1), newVCY.Value, precision: 5);
    }

    [Fact]
    public void WorldToScreen_And_ScreenToWorld_AreInverses()
    {
        // Arrange
        var canvas = new CanvasModel
        {
            ViewportCenterX = 120,
            ViewportCenterY = -45,
            ZoomScale = 1.5
        };
        double canvasWidth = 1024;
        double canvasHeight = 768;

        double worldX = 250;
        double worldY = 180;

        // Act
        var (screenX, screenY) = ViewportMath.WorldToScreen(worldX, worldY, canvas, canvasWidth, canvasHeight);
        var (restoredWorldX, restoredWorldY) = ViewportMath.ScreenToWorld(screenX, screenY, canvas, canvasWidth, canvasHeight);

        // Assert
        Assert.Equal(worldX, restoredWorldX, precision: 5);
        Assert.Equal(worldY, restoredWorldY, precision: 5);
    }
}
