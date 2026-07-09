using Microsoft.Maui.Graphics;

namespace DiagramsDesktop.Math;

public class ShapeIconDrawable : IDrawable
{
    public string ShapeType { get; set; } = "";
    public string ColorHex { get; set; } = "#6366f1";

    public void Draw(ICanvas canvas, RectF dirtyRect)
    {
        canvas.Antialias = true;
        
        // Clean bounds
        float w = dirtyRect.Width;
        float h = dirtyRect.Height;
        float cx = w / 2f;
        float cy = h / 2f;

        Color mainColor = Color.FromArgb(ColorHex);
        
        switch (ShapeType.ToLowerInvariant())
        {
            // Category Icons & Basic Shapes
            case "line":
                canvas.StrokeColor = mainColor;
                canvas.StrokeSize = 3;
                canvas.StrokeLineCap = LineCap.Round;
                canvas.DrawLine(w * 0.15f, cy, w * 0.85f, cy);
                break;

            case "circle":
                canvas.StrokeColor = mainColor;
                canvas.StrokeSize = 2;
                canvas.FillColor = mainColor.WithAlpha(0.12f);
                canvas.FillCircle(cx, cy, w * 0.35f);
                canvas.DrawCircle(cx, cy, w * 0.35f);
                break;

            case "rectangle":
                canvas.StrokeColor = mainColor;
                canvas.StrokeSize = 2;
                canvas.FillColor = mainColor.WithAlpha(0.12f);
                canvas.FillRectangle(w * 0.15f, h * 0.25f, w * 0.7f, h * 0.5f);
                canvas.DrawRectangle(w * 0.15f, h * 0.25f, w * 0.7f, h * 0.5f);
                break;

            // AWS Container Shapes
            case "aws-region":
                DrawContainerIcon(canvas, w, h, mainColor, "Region", true);
                break;

            case "aws-vpc":
                DrawContainerIcon(canvas, w, h, mainColor, "VPC", true);
                break;

            case "aws-availability-zone":
                DrawContainerIcon(canvas, w, h, mainColor, "AZ", true);
                break;

            case "aws-subnet":
                DrawContainerIcon(canvas, w, h, Color.FromArgb("#00a4a6"), "Subnet", true);
                break;

            // AWS Component Shapes
            case "aws-route-table":
                canvas.FillColor = Color.FromArgb("#f58536");
                canvas.FillRectangle(w * 0.1f, h * 0.1f, w * 0.8f, h * 0.8f);
                canvas.FillColor = Color.FromArgb("#9d5025");
                canvas.FillRectangle(w * 0.2f, h * 0.2f, w * 0.6f, h * 0.15f);
                canvas.FillRectangle(w * 0.2f, h * 0.425f, w * 0.6f, h * 0.15f);
                canvas.FillRectangle(w * 0.2f, h * 0.65f, w * 0.6f, h * 0.15f);
                break;

            case "aws-ec2":
                canvas.FillColor = Color.FromArgb("#f58536");
                canvas.FillRectangle(w * 0.1f, h * 0.1f, w * 0.8f, h * 0.8f);
                canvas.FillColor = Color.FromArgb("#9d5025");
                canvas.FillRectangle(w * 0.25f, h * 0.25f, w * 0.5f, h * 0.5f);
                break;

            case "aws-igw":
                canvas.FillColor = Color.FromArgb("#f58536");
                canvas.FillCircle(cx, cy, w * 0.4f);
                canvas.FillColor = Color.FromArgb("#9d5025");
                canvas.FillCircle(cx, cy, w * 0.28f);
                canvas.FontColor = Colors.White;
                canvas.FontSize = 8;
                canvas.DrawString("IGW", cx, cy + 3, HorizontalAlignment.Center);
                break;

            case "aws-nat":
                canvas.FillColor = Color.FromArgb("#f58536");
                canvas.FillCircle(cx, cy, w * 0.4f);
                canvas.FillColor = Color.FromArgb("#9d5025");
                canvas.FillRectangle(w * 0.3f, h * 0.3f, w * 0.4f, h * 0.4f);
                break;

            case "aws-lambda":
                canvas.FillColor = Color.FromArgb("#FF9900");
                canvas.FillRectangle(w * 0.1f, h * 0.1f, w * 0.8f, h * 0.8f);
                // Draw simple Lambda symbol
                canvas.StrokeColor = Colors.White;
                canvas.StrokeSize = 3;
                canvas.StrokeLineCap = LineCap.Round;
                canvas.DrawLine(w * 0.3f, h * 0.7f, w * 0.45f, h * 0.35f);
                canvas.DrawLine(w * 0.45f, h * 0.35f, w * 0.7f, h * 0.7f);
                break;

            // Azure / GCP placeholders
            case "azure-placeholder":
            case "gcp-placeholder":
                canvas.StrokeColor = mainColor;
                canvas.StrokeSize = 1.5f;
                canvas.StrokeDashPattern = new float[] { 3, 3 };
                canvas.FillColor = mainColor.WithAlpha(0.06f);
                canvas.FillRectangle(w * 0.1f, h * 0.1f, w * 0.8f, h * 0.8f);
                canvas.DrawRectangle(w * 0.1f, h * 0.1f, w * 0.8f, h * 0.8f);
                canvas.FontColor = mainColor;
                canvas.FontSize = 9;
                canvas.DrawString("Soon", cx, cy + 3, HorizontalAlignment.Center);
                break;

            default:
                // Default rectangle fallback
                canvas.StrokeColor = Colors.Gray;
                canvas.StrokeSize = 1;
                canvas.DrawRectangle(w * 0.2f, h * 0.2f, w * 0.6f, h * 0.6f);
                break;
        }
    }

    private void DrawContainerIcon(ICanvas canvas, float w, float h, Color color, string label, bool dashed)
    {
        canvas.StrokeColor = color;
        canvas.StrokeSize = 1.8f;
        if (dashed)
        {
            canvas.StrokeDashPattern = new float[] { 4, 2 };
        }
        canvas.FillColor = color.WithAlpha(0.12f);
        canvas.FillRectangle(w * 0.1f, h * 0.1f, w * 0.8f, h * 0.8f);
        canvas.DrawRectangle(w * 0.1f, h * 0.1f, w * 0.8f, h * 0.8f);

        canvas.FontColor = color;
        canvas.FontSize = 8;
        canvas.DrawString(label, w / 2, h * 0.8f, HorizontalAlignment.Center);
    }
}
