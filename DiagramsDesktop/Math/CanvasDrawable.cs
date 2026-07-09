using Microsoft.Maui.Graphics;
using DiagramsDesktop.Models;
using System.Linq;

namespace DiagramsDesktop.Math;

public class CanvasDrawable : IDrawable
{
    public DiagramModel? Diagram { get; set; }
    public string? SelectedShapeId { get; set; }
    public string? HoveredShapeId { get; set; }
    
    // Width and height from the GraphicsView bounds
    public double ViewportWidth { get; set; } = 800;
    public double ViewportHeight { get; set; } = 600;

    public void Draw(ICanvas canvas, RectF dirtyRect)
    {
        ViewportWidth = dirtyRect.Width;
        ViewportHeight = dirtyRect.Height;

        canvas.Antialias = true;

        if (Diagram == null || Diagram.Canvas == null)
        {
            // Draw empty canvas background
            canvas.FillColor = Color.FromArgb("#f1f5f9");
            canvas.FillRectangle(dirtyRect);
            DrawEmptyState(canvas, dirtyRect);
            return;
        }

        var canvasModel = Diagram.Canvas;

        // 1. Draw Canvas Background
        canvas.FillColor = Color.FromArgb(canvasModel.BackgroundColor ?? "#f1f5f9");
        canvas.FillRectangle(dirtyRect);

        // 2. Draw Grid Lines
        if (canvasModel.GridVisible)
        {
            DrawGrid(canvas, canvasModel);
        }

        // 3. Draw Axis Orientation Markers / Axes
        if (canvasModel.ShowAxes)
        {
            DrawAxes(canvas, canvasModel);
        }

        // 4. Draw Origin Marker
        if (canvasModel.ShowOriginMarker)
        {
            DrawOrigin(canvas, canvasModel);
        }

        // 5. Draw Shapes (sort by ZOrder or draw containers first)
        var shapes = Diagram.Shapes
            .Where(s => s.IsDeleted == 0)
            .OrderBy(s => s.ZOrder)
            .ToList();

        if (shapes.Count == 0)
        {
            DrawEmptyState(canvas, dirtyRect);
            return;
        }

        // Draw containers first so they sit in the background
        var containers = shapes.Where(s => IsContainerShape(s.Type)).ToList();
        var components = shapes.Where(s => !IsContainerShape(s.Type)).ToList();

        foreach (var shape in containers)
        {
            DrawShape(canvas, shape, canvasModel);
        }

        foreach (var shape in components)
        {
            DrawShape(canvas, shape, canvasModel);
        }
    }

    private bool IsContainerShape(string type)
    {
        string t = type.ToLowerInvariant();
        return t == "aws-region" || t == "aws-vpc" || t == "aws-availability-zone" || t == "aws-subnet";
    }

    private void DrawGrid(ICanvas canvas, CanvasModel model)
    {
        double spacingX = model.GridSpacingX;
        double spacingY = model.GridSpacingY;
        double zoom = model.ZoomScale;
        Color gridColor = Color.FromArgb(model.GridColor ?? "#e2e8f0").WithAlpha(0.5f);

        canvas.StrokeColor = gridColor;
        canvas.StrokeSize = 0.5f;

        // Find world coordinates for top-left and bottom-right of viewport
        var (minWX, maxWY) = ViewportMath.ScreenToWorld(0, 0, model, ViewportWidth, ViewportHeight);
        var (maxWX, minWY) = ViewportMath.ScreenToWorld(ViewportWidth, ViewportHeight, model, ViewportWidth, ViewportHeight);

        // Round to nearest spacing increment
        double startX = System.Math.Floor(minWX / spacingX) * spacingX;
        double endX = System.Math.Ceiling(maxWX / spacingX) * spacingX;
        double startY = System.Math.Floor(minWY / spacingY) * spacingY;
        double endY = System.Math.Ceiling(maxWY / spacingY) * spacingY;

        // Draw vertical grid lines
        for (double wx = startX; wx <= endX; wx += spacingX)
        {
            var (sx, _) = ViewportMath.WorldToScreen(wx, 0, model, ViewportWidth, ViewportHeight);
            canvas.DrawLine((float)sx, 0, (float)sx, (float)ViewportHeight);
        }

        // Draw horizontal grid lines
        for (double wy = startY; wy <= endY; wy += spacingY)
        {
            var (_, sy) = ViewportMath.WorldToScreen(0, wy, model, ViewportWidth, ViewportHeight);
            canvas.DrawLine(0, (float)sy, (float)ViewportWidth, (float)sy);
        }
    }

    private void DrawAxes(ICanvas canvas, CanvasModel model)
    {
        canvas.StrokeColor = Color.FromArgb("#94a3b8").WithAlpha(0.7f);
        canvas.StrokeSize = 1.2f;

        // Y Axis (X = 0)
        var (sxY, _) = ViewportMath.WorldToScreen(0, 0, model, ViewportWidth, ViewportHeight);
        if (sxY >= 0 && sxY <= ViewportWidth)
        {
            canvas.DrawLine((float)sxY, 0, (float)sxY, (float)ViewportHeight);
        }

        // X Axis (Y = 0)
        var (_, syX) = ViewportMath.WorldToScreen(0, 0, model, ViewportWidth, ViewportHeight);
        if (syX >= 0 && syX <= ViewportHeight)
        {
            canvas.DrawLine(0, (float)syX, (float)ViewportWidth, (float)syX);
        }
    }

    private void DrawOrigin(ICanvas canvas, CanvasModel model)
    {
        var (sx, sy) = ViewportMath.WorldToScreen(0, 0, model, ViewportWidth, ViewportHeight);
        
        canvas.StrokeColor = Color.FromArgb("#64748b");
        canvas.StrokeSize = 2.0f;
        canvas.FillColor = Color.FromArgb("#64748b").WithAlpha(0.2f);
        
        // Draw crosshair or circle
        canvas.DrawCircle((float)sx, (float)sy, 8);
        canvas.DrawLine((float)sx - 12, (float)sy, (float)sx + 12, (float)sy);
        canvas.DrawLine((float)sx, (float)sy - 12, (float)sx, (float)sy + 12);
    }

    private void DrawShape(ICanvas canvas, ShapeModel shape, CanvasModel model)
    {
        double zoom = model.ZoomScale;
        var (sx, sy) = ViewportMath.WorldToScreen(shape.WorldX, shape.WorldY, model, ViewportWidth, ViewportHeight);
        
        float w = (float)(shape.Width * zoom);
        float h = (float)(shape.Height * zoom);
        float rx = (float)(shape.Radius.HasValue ? shape.Radius.Value * zoom : (shape.Width / 2.0) * zoom);

        bool isSelected = shape.ShapeID == SelectedShapeId;
        bool isHovered = shape.ShapeID == HoveredShapeId;

        string type = shape.Type.ToLowerInvariant();
        string effectiveGeom = (shape.Radius.HasValue || type == "circle" || type == "aws-igw" || type == "aws-nat") ? "circle" : (type == "line" ? "line" : "rectangle");

        Color mainColor = Color.FromArgb(shape.Color ?? "#6366f1");

        // 1. Draw Geometry
        if (effectiveGeom == "line")
        {
            canvas.StrokeColor = mainColor;
            canvas.StrokeSize = (float)(2.5 * zoom);
            canvas.StrokeLineCap = LineCap.Round;
            canvas.DrawLine((float)(sx - w / 2), (float)(sy - h / 2), (float)(sx + w / 2), (float)(sy + h / 2));
        }
        else if (effectiveGeom == "circle")
        {
            canvas.StrokeColor = mainColor;
            canvas.StrokeSize = (float)(1.5 * zoom);
            
            if (shape.TransparentFill == true)
            {
                canvas.FillColor = Colors.Transparent;
            }
            else
            {
                canvas.FillColor = Color.FromArgb(shape.FillColor ?? "#6366f1");
            }
            
            canvas.FillCircle((float)sx, (float)sy, rx);
            canvas.DrawCircle((float)sx, (float)sy, rx);
        }
        else // Rectangle/Container
        {
            canvas.StrokeColor = mainColor;
            canvas.StrokeSize = (float)(1.5 * zoom);

            float rectX = (float)(sx - w / 2);
            float rectY = (float)(sy - h / 2);

            if (IsContainerShape(shape.Type))
            {
                // Container styles: dashed, low opacity fill
                canvas.StrokeDashPattern = new float[] { (float)(6 * zoom), (float)(4 * zoom) };
                canvas.FillColor = mainColor.WithAlpha(0.08f);
                canvas.FillRoundedRectangle(rectX, rectY, w, h, (float)(4 * zoom));
                canvas.DrawRoundedRectangle(rectX, rectY, w, h, (float)(4 * zoom));
                canvas.StrokeDashPattern = null; // reset
            }
            else
            {
                if (shape.TransparentFill == true)
                {
                    canvas.FillColor = Colors.Transparent;
                }
                else
                {
                    canvas.FillColor = Color.FromArgb(shape.FillColor ?? "#6366f1");
                }
                
                canvas.FillRectangle(rectX, rectY, w, h);
                canvas.DrawRectangle(rectX, rectY, w, h);
            }
        }

        // 2. Draw Custom Icons inside Component Shapes
        DrawComponentIcon(canvas, type, sx, sy, w, h, rx, zoom);

        // 3. Draw Labels
        DrawShapeLabel(canvas, shape, sx, sy, w, h, rx, zoom, type, effectiveGeom);

        // 4. Draw Hover and Selection Outlines
        if (isHovered)
        {
            canvas.StrokeColor = Color.FromArgb("#93c5fd");
            canvas.StrokeSize = (float)(1.5 * zoom);
            canvas.StrokeDashPattern = new float[] { 4, 3 };

            if (effectiveGeom == "circle")
            {
                canvas.DrawCircle((float)sx, (float)sy, rx + 3);
            }
            else if (effectiveGeom == "line")
            {
                // Draw thin highlight parallel to line
            }
            else
            {
                canvas.DrawRectangle((float)(sx - w / 2 - 3), (float)(sy - h / 2 - 3), w + 6, h + 6);
            }
            canvas.StrokeDashPattern = null;
        }

        if (isSelected)
        {
            canvas.StrokeColor = Color.FromArgb("#3b82f6");
            canvas.StrokeSize = (float)(2.0 * zoom);
            canvas.StrokeDashPattern = new float[] { 5, 3 };

            if (effectiveGeom == "circle")
            {
                canvas.DrawCircle((float)sx, (float)sy, rx + 2);
            }
            else if (effectiveGeom == "line")
            {
                canvas.StrokeColor = Color.FromArgb("#3b82f6").WithAlpha(0.4f);
                canvas.StrokeSize = (float)(4.5 * zoom);
                canvas.StrokeLineCap = LineCap.Round;
                canvas.DrawLine((float)(sx - w / 2), (float)(sy - h / 2), (float)(sx + w / 2), (float)(sy + h / 2));
            }
            else
            {
                canvas.DrawRectangle((float)(sx - w / 2 - 2), (float)(sy - h / 2 - 2), w + 4, h + 4);
            }
            canvas.StrokeDashPattern = null;
        }
    }

    private void DrawComponentIcon(ICanvas canvas, string type, double sx, double sy, float w, float h, float rx, double zoom)
    {
        // Draw the native shapes for component icons
        switch (type)
        {
            case "aws-route-table":
                canvas.FillColor = Color.FromArgb("#9d5025");
                canvas.FillRectangle((float)(sx - w * 0.3), (float)(sy - h * 0.3), (float)(w * 0.6), (float)(h * 0.15));
                canvas.FillRectangle((float)(sx - w * 0.3), (float)(sy - h * 0.075), (float)(w * 0.6), (float)(h * 0.15));
                canvas.FillRectangle((float)(sx - w * 0.3), (float)(sy + h * 0.15), (float)(w * 0.6), (float)(h * 0.15));
                break;

            case "aws-ec2":
                canvas.FillColor = Color.FromArgb("#9d5025");
                canvas.FillRectangle((float)(sx - w * 0.25), (float)(sy - h * 0.25), (float)(w * 0.5), (float)(h * 0.5));
                break;

            case "aws-igw":
                canvas.FillColor = Color.FromArgb("#9d5025");
                canvas.FillCircle((float)sx, (float)sy, (float)(rx * 0.7));
                canvas.FontColor = Colors.White;
                canvas.FontSize = (float)(8 * zoom);
                canvas.DrawString("IGW", (float)sx, (float)(sy + 3 * zoom), HorizontalAlignment.Center);
                break;

            case "aws-nat":
                canvas.FillColor = Color.FromArgb("#9d5025");
                canvas.FillRectangle((float)(sx - rx * 0.5), (float)(sy - rx * 0.5), (float)(rx * 1.0), (float)(rx * 1.0));
                break;

            case "aws-lambda":
                // Draw white lambda symbol
                canvas.StrokeColor = Colors.White;
                canvas.StrokeSize = (float)(3 * zoom);
                canvas.StrokeLineCap = LineCap.Round;
                canvas.DrawLine((float)(sx - w * 0.2), (float)(sy + h * 0.2), (float)(sx - w * 0.05), (float)(sy - h * 0.15));
                canvas.DrawLine((float)(sx - w * 0.05), (float)(sy - h * 0.15), (float)(sx + w * 0.2), (float)(sy + h * 0.2));
                break;
        }
    }

    private void DrawShapeLabel(ICanvas canvas, ShapeModel shape, double sx, double sy, float w, float h, float rx, double zoom, string type, string effectiveGeom)
    {
        if (string.IsNullOrEmpty(shape.Label)) return;

        canvas.FontColor = Color.FromArgb("#475569");
        canvas.FontSize = (float)(11 * zoom);
        
        float labelX = (float)sx;
        float labelY = (float)sy;
        HorizontalAlignment alignment = HorizontalAlignment.Center;

        if (effectiveGeom == "circle")
        {
            // Centered below circle
            labelY = (float)(sy + rx + 14 * zoom);
        }
        else if (IsContainerShape(type))
        {
            // Inner top-left corner
            labelX = (float)(sx - w / 2 + 10 * zoom);
            labelY = (float)(sy - h / 2 + 16 * zoom);
            alignment = HorizontalAlignment.Left;
        }
        else if (effectiveGeom == "line")
        {
            // Centered below line
            labelY = (float)(sy + System.Math.Abs(h) / 2 + 16 * zoom);
        }
        else
        {
            // Centered below rectangle
            labelY = (float)(sy + h / 2 + 14 * zoom);
        }

        canvas.DrawString(shape.Label, labelX, labelY, alignment);
    }

    private void DrawEmptyState(ICanvas canvas, RectF dirtyRect)
    {
        float cx = dirtyRect.Width / 2f;
        float cy = dirtyRect.Height / 2f;

        float boxWidth = 72;
        float boxHeight = 72;
        float boxX = cx - (boxWidth / 2f);
        float boxY = cy - 80f; // offset vertically upward to make room for text below

        // 1. Draw Dotted Rounded Rect
        canvas.StrokeColor = Color.FromArgb("#cbd5e1");
        canvas.StrokeSize = 2;
        canvas.StrokeDashPattern = new float[] { 7, 5 };
        canvas.DrawRoundedRectangle(boxX, boxY, boxWidth, boxHeight, 10);
        canvas.StrokeDashPattern = null; // reset

        // 2. Draw Plus sign inside the box
        canvas.StrokeColor = Color.FromArgb("#cbd5e1");
        canvas.StrokeSize = 2;
        canvas.StrokeLineCap = LineCap.Round;
        // Vert line:
        canvas.DrawLine(boxX + 36, boxY + 24, boxX + 36, boxY + 48);
        // Horiz line:
        canvas.DrawLine(boxX + 24, boxY + 36, boxX + 48, boxY + 36);

        // 3. Draw Text below the box
        canvas.FontColor = Color.FromArgb("#64748b");
        canvas.FontSize = 16;
        // Draw bold-like title (using string representation, MAUI drawing doesn't support easy font weight styling, but size does the job)
        canvas.DrawString("Diagram Workspace", cx, cy + 16, HorizontalAlignment.Center);

        canvas.FontColor = Color.FromArgb("#94a3b8");
        canvas.FontSize = 13;
        canvas.DrawString("Canvas ready for objects", cx, cy + 38, HorizontalAlignment.Center);
    }
}

