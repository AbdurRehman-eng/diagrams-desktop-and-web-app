using System;
using DiagramsDesktop.Models;

namespace DiagramsDesktop.Math;

public static class ViewportMath
{
    public static (double dX, double dY) CalculatePan(double deltaX, double deltaY, double zoom)
    {
        if (zoom <= 0) return (0, 0);
        return (
            dX: -(deltaX / zoom),
            dY: deltaY / zoom // Y-flip: screen Y moves down, world Y must increase (or vice versa depending on logic)
        );
    }

    public static (double zoom, double? newVCX, double? newVCY) CalculateZoom(
        double currentZoom,
        double direction,
        double anchorScreenX,
        double anchorScreenY,
        double canvasWidth,
        double canvasHeight,
        CanvasModel canvas)
    {
        double step = CanvasConfig.ZoomStep;
        double newZoom = direction > 0
            ? System.Math.Min(CanvasConfig.MaxZoom, currentZoom + step)
            : System.Math.Max(CanvasConfig.MinZoom, currentZoom - step);

        if (System.Math.Abs(newZoom - currentZoom) < 1e-9)
        {
            return (newZoom, null, null);
        }

        double sCenterX = canvasWidth / 2.0;
        double sCenterY = canvasHeight / 2.0;

        double dx = anchorScreenX - sCenterX;
        double dy = anchorScreenY - sCenterY;

        double newVCX = canvas.ViewportCenterX + dx * (1.0 / currentZoom - 1.0 / newZoom);
        double newVCY = canvas.ViewportCenterY - dy * (1.0 / currentZoom - 1.0 / newZoom);

        return (newZoom, newVCX, newVCY);
    }

    public static (double x, double y) WorldToScreen(
        double worldX,
        double worldY,
        CanvasModel canvas,
        double canvasWidth,
        double canvasHeight)
    {
        if (canvas == null) return (0, 0);

        double zoom = canvas.ZoomScale;
        double vCenterX = canvas.ViewportCenterX;
        double vCenterY = canvas.ViewportCenterY;

        double sCenterX = canvasWidth / 2.0;
        double sCenterY = canvasHeight / 2.0;

        double screenX = sCenterX + (worldX - vCenterX) * zoom;
        double screenY = sCenterY - (worldY - vCenterY) * zoom; // Y-flip

        return (screenX, screenY);
    }

    public static (double x, double y) ScreenToWorld(
        double screenX,
        double screenY,
        CanvasModel canvas,
        double canvasWidth,
        double canvasHeight)
    {
        if (canvas == null) return (0, 0);

        double zoom = canvas.ZoomScale;
        double vCenterX = canvas.ViewportCenterX;
        double vCenterY = canvas.ViewportCenterY;

        double sCenterX = canvasWidth / 2.0;
        double sCenterY = canvasHeight / 2.0;

        double worldX = (screenX - sCenterX) / zoom + vCenterX;
        double worldY = -(screenY - sCenterY) / zoom + vCenterY; // Y-flip

        return (worldX, worldY);
    }
}
