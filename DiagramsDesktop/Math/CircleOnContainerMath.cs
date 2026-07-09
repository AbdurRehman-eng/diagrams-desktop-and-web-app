using System;
using DiagramsDesktop.Models;

namespace DiagramsDesktop.Math;

public struct EdgeBounds
{
    public double Left;
    public double Right;
    public double Top;
    public double Bottom;
}

public static class CircleOnContainerMath
{
    public static EdgeBounds GetBounds(ShapeModel parentShape)
    {
        double hw = parentShape.Width / 2.0;
        double hh = parentShape.Height / 2.0;
        return new EdgeBounds
        {
            Left = parentShape.WorldX - hw,
            Right = parentShape.WorldX + hw,
            Top = parentShape.WorldY + hh,   // world Y increases up
            Bottom = parentShape.WorldY - hh
        };
    }

    public static (double CenterX, double CenterY) FromEdgeBounds(EdgeBounds b, string hostEdge, double t)
    {
        double tc = System.Math.Clamp(t, 0.0, 1.0);
        switch (hostEdge)
        {
            case "Top":
                return (b.Left + tc * (b.Right - b.Left), b.Top);
            case "Right":
                return (b.Right, b.Top - tc * (b.Top - b.Bottom));
            case "Bottom":
                return (b.Right - tc * (b.Right - b.Left), b.Bottom);
            case "Left":
                return (b.Left, b.Bottom + tc * (b.Top - b.Bottom));
            default:
                return (b.Left, b.Top);
        }
    }

    public static (string HostEdge, double EdgeParameterT, double CenterX, double CenterY) Project(double px, double py, ShapeModel parentShape)
    {
        var b = GetBounds(parentShape);

        // Clamp pointer to the bounding box
        double cx = System.Math.Clamp(px, b.Left, b.Right);
        double cy = System.Math.Clamp(py, b.Bottom, b.Top);

        // Perpendicular distance to each edge
        double dTop = System.Math.Abs(cy - b.Top);
        double dBottom = System.Math.Abs(cy - b.Bottom);
        double dLeft = System.Math.Abs(cx - b.Left);
        double dRight = System.Math.Abs(cx - b.Right);

        // Find nearest edge
        string nearest = "Top";
        double minDist = dTop;

        if (dBottom < minDist) { minDist = dBottom; nearest = "Bottom"; }
        if (dLeft < minDist) { minDist = dLeft; nearest = "Left"; }
        if (dRight < minDist) { minDist = dRight; nearest = "Right"; }

        double t = ComputeT(px, py, b, nearest);
        double tc = System.Math.Clamp(t, 0.0, 1.0);
        var center = FromEdgeBounds(b, nearest, tc);

        return (nearest, tc, center.CenterX, center.CenterY);
    }

    public static (string HostEdge, double EdgeParameterT, double CenterX, double CenterY) ProjectWithCornerTransition(
        double px, double py, ShapeModel parentShape, string currentHostEdge)
    {
        var b = GetBounds(parentShape);
        double tRaw = ComputeT(px, py, b, currentHostEdge);

        if (tRaw >= 0.0 && tRaw <= 1.0)
        {
            // Still on the current edge
            var center = FromEdgeBounds(b, currentHostEdge, tRaw);
            return (currentHostEdge, tRaw, center.CenterX, center.CenterY);
        }

        // We crossed a corner. Project globally onto the nearest edge.
        return Project(px, py, parentShape);
    }

    private static double ComputeT(double px, double py, EdgeBounds b, string edge)
    {
        switch (edge)
        {
            case "Top":
                return (b.Right - b.Left) > 0 ? (px - b.Left) / (b.Right - b.Left) : 0;
            case "Right":
                return (b.Top - b.Bottom) > 0 ? (b.Top - py) / (b.Top - b.Bottom) : 0;
            case "Bottom":
                return (b.Right - b.Left) > 0 ? (b.Right - px) / (b.Right - b.Left) : 0;
            case "Left":
                return (b.Top - b.Bottom) > 0 ? (py - b.Bottom) / (b.Top - b.Bottom) : 0;
            default:
                return 0;
        }
    }
}
