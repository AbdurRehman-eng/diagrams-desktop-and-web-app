using System;

namespace DiagramsDesktop.Math;

public struct CollisionObject
{
    public string Type; // "rectangle" | "circle" | "line"
    public double X;
    public double Y;
    public double Width;
    public double Height;
    public double CX;
    public double CY;
    public double R;
    public double X1;
    public double Y1;
    public double X2;
    public double Y2;
}

public static class CollisionHelper
{
    private static double Dist2(double x1, double y1, double x2, double y2)
    {
        return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    }

    private static double Clamp(double val, double min, double max)
    {
        return System.Math.Max(min, System.Math.Min(max, val));
    }

    private static bool LineIntersectsLine(double x1, double y1, double x2, double y2, double x3, double y3, double x4, double y4)
    {
        double den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den == 0) return false; // parallel/collinear

        double t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        double u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;

        return t >= 0 && t <= 1 && u >= 0 && u <= 1;
    }

    private static bool RectIntersectsRect(CollisionObject r1, CollisionObject r2)
    {
        return r1.X <= r2.X + r2.Width &&
               r1.X + r1.Width >= r2.X &&
               r1.Y <= r2.Y + r2.Height &&
               r1.Y + r1.Height >= r2.Y;
    }

    private static bool CircleIntersectsCircle(CollisionObject c1, CollisionObject c2)
    {
        double d2 = Dist2(c1.CX, c1.CY, c2.CX, c2.CY);
        double sumR = c1.R + c2.R;
        return d2 <= sumR * sumR;
    }

    private static bool CircleIntersectsRect(CollisionObject c, CollisionObject r)
    {
        double px = Clamp(c.CX, r.X, r.X + r.Width);
        double py = Clamp(c.CY, r.Y, r.Y + r.Height);
        return Dist2(c.CX, c.CY, px, py) <= c.R * c.R;
    }

    private static bool LineIntersectsLineObj(CollisionObject l1, CollisionObject l2)
    {
        return LineIntersectsLine(l1.X1, l1.Y1, l1.X2, l1.Y2, l2.X1, l2.Y1, l2.X2, l2.Y2);
    }

    private static bool LineIntersectsRect(CollisionObject l, CollisionObject r)
    {
        bool p1Inside = l.X1 > r.X && l.X1 < r.X + r.Width && l.Y1 > r.Y && l.Y1 < r.Y + r.Height;
        bool p2Inside = l.X2 > r.X && l.X2 < r.X + r.Width && l.Y2 > r.Y && l.Y2 < r.Y + r.Height;
        if (p1Inside && p2Inside) return false; // fully inside

        bool e1 = LineIntersectsLine(l.X1, l.Y1, l.X2, l.Y2, r.X, r.Y, r.X + r.Width, r.Y);
        bool e2 = LineIntersectsLine(l.X1, l.Y1, l.X2, l.Y2, r.X, r.Y + r.Height, r.X + r.Width, r.Y + r.Height);
        bool e3 = LineIntersectsLine(l.X1, l.Y1, l.X2, l.Y2, r.X, r.Y, r.X, r.Y + r.Height);
        bool e4 = LineIntersectsLine(l.X1, l.Y1, l.X2, l.Y2, r.X + r.Width, r.Y, r.X + r.Width, r.Y + r.Height);

        return e1 || e2 || e3 || e4;
    }

    private static bool LineIntersectsCircle(CollisionObject l, CollisionObject c)
    {
        double p1Dist2 = Dist2(l.X1, l.Y1, c.CX, c.CY);
        double p2Dist2 = Dist2(l.X2, l.Y2, c.CX, c.CY);

        if (p1Dist2 < c.R * c.R && p2Dist2 < c.R * c.R) return false; // completely inside

        double dx = l.X2 - l.X1;
        double dy = l.Y2 - l.Y1;
        double lenSq = dx * dx + dy * dy;

        if (lenSq == 0) return Dist2(l.X1, l.Y1, c.CX, c.CY) <= c.R * c.R;

        double t = Clamp(((c.CX - l.X1) * dx + (c.CY - l.Y1) * dy) / lenSq, 0, 1);

        double closestX = l.X1 + t * dx;
        double closestY = l.Y1 + t * dy;

        return Dist2(c.CX, c.CY, closestX, closestY) <= c.R * c.R;
    }

    public static bool CheckCollision(CollisionObject shapeA, CollisionObject shapeB)
    {
        string tA = shapeA.Type.ToLowerInvariant();
        string tB = shapeB.Type.ToLowerInvariant();

        if (tA == "rectangle" && tB == "rectangle") return RectIntersectsRect(shapeA, shapeB);
        if (tA == "circle" && tB == "circle") return CircleIntersectsCircle(shapeA, shapeB);

        if (tA == "circle" && tB == "rectangle") return CircleIntersectsRect(shapeA, shapeB);
        if (tA == "rectangle" && tB == "circle") return CircleIntersectsRect(shapeB, shapeA);

        if (tA == "line" && tB == "line") return LineIntersectsLineObj(shapeA, shapeB);

        if (tA == "line" && tB == "rectangle") return LineIntersectsRect(shapeA, shapeB);
        if (tA == "rectangle" && tB == "line") return LineIntersectsRect(shapeB, shapeA);

        if (tA == "line" && tB == "circle") return LineIntersectsCircle(shapeA, shapeB);
        if (tA == "circle" && tB == "line") return LineIntersectsCircle(shapeB, shapeA);

        return false;
    }
}
