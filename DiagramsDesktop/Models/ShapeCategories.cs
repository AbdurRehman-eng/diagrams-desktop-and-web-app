using System;
using System.Collections.Generic;
using System.Linq;

namespace DiagramsDesktop.Models;

public static class ShapeCategories
{
    private static readonly List<ShapeCategory> _categories = new()
    {
        new ShapeCategory { Id = "basic-shapes", Name = "Basic Shapes", DisplayOrder = 0, Icon = SvgRectangle("#6366f1") },
        new ShapeCategory { Id = "aws", Name = "AWS", DisplayOrder = 1, Icon = SvgAwsRegion("#f59e0b") },
        new ShapeCategory { Id = "azure", Name = "Azure", DisplayOrder = 2, IsPlaceholder = true, PlaceholderMessage = "Azure shapes — Coming Soon", Icon = PlaceholderRect("#0ea5e9") },
        new ShapeCategory { Id = "gcp", Name = "GCP", DisplayOrder = 3, IsPlaceholder = true, PlaceholderMessage = "GCP shapes — Coming Soon", Icon = PlaceholderRect("#10b981") }
    };

    private static readonly Dictionary<string, List<ShapeLibraryItem>> _itemsByCategory = new()
    {
        {
            "basic-shapes", new List<ShapeLibraryItem>
            {
                new ShapeLibraryItem { Id = "shape-line", Type = "line", Label = "Line", CategoryId = "basic-shapes", GeometryType = "line", SvgIcon = SvgLine("#10b981"), DefaultWidth = 80, DefaultHeight = 0, FillColor = "#10b981", StrokeColor = "#10b981" },
                new ShapeLibraryItem { Id = "shape-circle", Type = "circle", Label = "Circle", CategoryId = "basic-shapes", GeometryType = "circle", SvgIcon = SvgCircle("#6366f1"), DefaultWidth = 80, DefaultHeight = 80, FillColor = "#6366f1", StrokeColor = "#6366f1" },
                new ShapeLibraryItem { Id = "shape-rectangle", Type = "rectangle", Label = "Rectangle", CategoryId = "basic-shapes", GeometryType = "rectangle", SvgIcon = SvgRectangle("#f59e0b"), DefaultWidth = 100, DefaultHeight = 60, FillColor = "#f59e0b", StrokeColor = "#f59e0b" }
            }
        },
        {
            "aws", new List<ShapeLibraryItem>
            {
                new ShapeLibraryItem { Id = "aws-region", Type = "aws-region", Label = "Region", CategoryId = "aws", GeometryType = "rectangle", SvgIcon = SvgAwsRegion("#f59e0b"), DefaultWidth = 360, DefaultHeight = 280, FillColor = "#f59e0b", StrokeColor = "#f59e0b", IsContainer = true },
                new ShapeLibraryItem { Id = "aws-vpc", Type = "aws-vpc", Label = "VPC", CategoryId = "aws", GeometryType = "rectangle", SvgIcon = SvgAwsVpc("#6366f1"), DefaultWidth = 280, DefaultHeight = 220, FillColor = "#6366f1", StrokeColor = "#6366f1", IsContainer = true },
                new ShapeLibraryItem { Id = "aws-availability-zone", Type = "aws-availability-zone", Label = "Availability Zone", CategoryId = "aws", GeometryType = "rectangle", SvgIcon = SvgAwsAz("#0ea5e9"), DefaultWidth = 200, DefaultHeight = 160, FillColor = "#0ea5e9", StrokeColor = "#0ea5e9", IsContainer = true },
                new ShapeLibraryItem { Id = "aws-route-table", Type = "aws-route-table", Label = "Route Table", CategoryId = "aws", GeometryType = "rectangle", TransparentFill = true, SvgIcon = SvgAwsRouteTable(), DefaultWidth = 140, DefaultHeight = 80, FillColor = "#10b981", StrokeColor = "#10b981" },
                new ShapeLibraryItem { Id = "aws-ec2", Type = "aws-ec2", Label = "EC2", CategoryId = "aws", GeometryType = "rectangle", TransparentFill = true, SvgIcon = SvgAwsEc2(), DefaultWidth = 60, DefaultHeight = 60, FillColor = "#f59e0b", StrokeColor = "#f59e0b" },
                new ShapeLibraryItem { Id = "aws-igw", Type = "aws-igw", Label = "Internet Gateway", CategoryId = "aws", GeometryType = "circle", SvgIcon = SvgAwsIgw(), DefaultWidth = 60, DefaultHeight = 60, FillColor = "#f58536", StrokeColor = "#f58536", EdgeAttachment = true, EdgeContainerType = "aws-vpc", BaseShapeType = "circle-on-container" },
                new ShapeLibraryItem { Id = "aws-nat", Type = "aws-nat", Label = "NAT Gateway", CategoryId = "aws", GeometryType = "circle", TransparentFill = true, SvgIcon = SvgAwsNat(), DefaultWidth = 60, DefaultHeight = 60, FillColor = "#f58536", StrokeColor = "#f58536" },
                new ShapeLibraryItem { Id = "aws-subnet", Type = "aws-subnet", Label = "AWS Subnet", CategoryId = "aws", GeometryType = "rectangle", SvgIcon = SvgAwsSubnet("#00a4a6"), DefaultWidth = 200, DefaultHeight = 160, FillColor = "#00a4a6", StrokeColor = "#00a4a6", IsContainer = true },
                new ShapeLibraryItem { Id = "aws-lambda", Type = "aws-lambda", Label = "AWS Lambda", CategoryId = "aws", GeometryType = "rectangle", TransparentFill = true, SvgIcon = SvgAwsLambda(), DefaultWidth = 60, DefaultHeight = 60, FillColor = "#FF9900", StrokeColor = "#FF9900" }
            }
        },
        {
            "azure", new List<ShapeLibraryItem>
            {
                new ShapeLibraryItem { Id = "azure-coming-soon", Type = "azure-placeholder", Label = "Coming Soon", CategoryId = "azure", IsPlaceholder = true, SvgIcon = PlaceholderRect("#0ea5e9") }
            }
        },
        {
            "gcp", new List<ShapeLibraryItem>
            {
                new ShapeLibraryItem { Id = "gcp-coming-soon", Type = "gcp-placeholder", Label = "Coming Soon", CategoryId = "gcp", IsPlaceholder = true, SvgIcon = PlaceholderRect("#10b981") }
            }
        }
    };

    public static List<ShapeCategory> LoadShapeCategories()
    {
        return _categories.OrderBy(c => c.DisplayOrder).ToList();
    }

    public static List<ShapeLibraryItem> GetCategoryItems(string categoryId)
    {
        if (string.IsNullOrEmpty(categoryId)) return new List<ShapeLibraryItem>();
        return _itemsByCategory.TryGetValue(categoryId, out var items) ? items.ToList() : new List<ShapeLibraryItem>();
    }

    public static ShapeCategory? GetCategoryById(string categoryId)
    {
        return _categories.FirstOrDefault(c => c.Id == categoryId);
    }

    public static int GetCategoryCount(string categoryId)
    {
        if (!_itemsByCategory.TryGetValue(categoryId, out var items)) return 0;
        return items.Count(i => !i.IsPlaceholder);
    }

    public static ShapeLibraryItem? GetItemByType(string type)
    {
        foreach (var items in _itemsByCategory.Values)
        {
            var found = items.FirstOrDefault(i => i.Type == type);
            if (found != null) return found;
        }
        return null;
    }

    public static List<ShapeLibraryItem> GetAllItems()
    {
        return _itemsByCategory.Values.SelectMany(x => x).ToList();
    }

    // ── SVG Helpers ────────────────────────────────────────────────────────────

    private static string SvgLine(string c = "#10b981") =>
        $"<svg viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><line x1=\"6\" y1=\"20\" x2=\"34\" y2=\"20\" stroke=\"{c}\" stroke-width=\"2.5\" stroke-linecap=\"round\"/></svg>";

    private static string SvgCircle(string c = "#6366f1") =>
        $"<svg viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"20\" cy=\"20\" r=\"14\" fill=\"{c}\" fill-opacity=\"0.1\" stroke=\"{c}\" stroke-width=\"2\"/></svg>";

    private static string SvgRectangle(string c = "#f59e0b") =>
        $"<svg viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"6\" y=\"10\" width=\"28\" height=\"20\" fill=\"{c}\" fill-opacity=\"0.1\" stroke=\"{c}\" stroke-width=\"2\"/></svg>";

    private static string SvgAwsRegion(string color) =>
        $"<svg viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"34\" height=\"34\" rx=\"2\" fill=\"{color}\" fill-opacity=\"0.12\" stroke=\"{color}\" stroke-width=\"1.8\" stroke-dasharray=\"4 2\"/><circle cx=\"20\" cy=\"18\" r=\"7\" fill=\"none\" stroke=\"{color}\" stroke-width=\"1.5\"/><ellipse cx=\"20\" cy=\"18\" rx=\"3\" ry=\"7\" fill=\"none\" stroke=\"{color}\" stroke-width=\"1.5\"/><line x1=\"13\" y1=\"18\" x2=\"27\" y2=\"18\" stroke=\"{color}\" stroke-width=\"1.5\"/><text x=\"20\" y=\"32\" text-anchor=\"middle\" font-size=\"6.5\" fill=\"{color}\" font-family=\"sans-serif\" font-weight=\"600\">Region</text></svg>";

    private static string SvgAwsVpc(string color) =>
        $"<svg viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"34\" height=\"34\" rx=\"2\" fill=\"{color}\" fill-opacity=\"0.12\" stroke=\"{color}\" stroke-width=\"1.8\" stroke-dasharray=\"4 2\"/><path d=\"M 13 21 C 13 17 18 16 19 14 C 21 11 26 12 27 15 C 31 16 31 22 27 24 L 15 24 C 11 24 11 22 13 21 Z\" fill=\"none\" stroke=\"{color}\" stroke-width=\"1.5\"/><text x=\"20\" y=\"32\" text-anchor=\"middle\" font-size=\"6.5\" fill=\"{color}\" font-family=\"sans-serif\" font-weight=\"600\">VPC</text></svg>";

    private static string SvgAwsAz(string color) =>
        $"<svg viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"34\" height=\"34\" rx=\"2\" fill=\"{color}\" fill-opacity=\"0.12\" stroke=\"{color}\" stroke-width=\"1.8\" stroke-dasharray=\"4 2\"/><line x1=\"14\" y1=\"14\" x2=\"26\" y2=\"14\" stroke=\"{color}\" stroke-width=\"1.2\" stroke-dasharray=\"2 1\"/><line x1=\"14\" y1=\"18\" x2=\"26\" y2=\"18\" stroke=\"{color}\" stroke-width=\"1.2\" stroke-dasharray=\"2 1\"/><line x1=\"14\" y1=\"22\" x2=\"26\" y2=\"22\" stroke=\"{color}\" stroke-width=\"1.2\" stroke-dasharray=\"2 1\"/><text x=\"20\" y=\"32\" text-anchor=\"middle\" font-size=\"6.5\" fill=\"{color}\" font-family=\"sans-serif\" font-weight=\"600\">AZ</text></svg>";

    private static string SvgAwsRouteTable() =>
        "<svg viewBox=\"0 0 80 80\" fill=\"#fff\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0\" y=\"0\" width=\"80\" height=\"80\" fill=\"#f58536\"/><rect x=\"10\" y=\"10\" width=\"60\" height=\"15\" fill=\"#9d5025\"/><rect x=\"10\" y=\"32\" width=\"60\" height=\"15\" fill=\"#9d5025\"/><rect x=\"10\" y=\"55\" width=\"60\" height=\"15\" fill=\"#9d5025\"/><text x=\"40\" y=\"20\" text-anchor=\"middle\" font-size=\"8\" fill=\"#fff\" font-family=\"sans-serif\">Route Table</text></svg>";

    private static string SvgAwsEc2() =>
        "<svg viewBox=\"0 0 80 80\" fill=\"#fff\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0\" y=\"0\" width=\"80\" height=\"80\" fill=\"#f58536\"/><rect x=\"20\" y=\"20\" width=\"40\" height=\"40\" fill=\"#9d5025\"/><text x=\"40\" y=\"45\" text-anchor=\"middle\" font-size=\"12\" fill=\"#fff\" font-family=\"sans-serif\">EC2</text></svg>";

    private static string SvgAwsIgw() =>
        "<svg viewBox=\"0 0 80 80\" fill=\"#fff\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"40\" cy=\"40\" r=\"35\" fill=\"#f58536\"/><circle cx=\"40\" cy=\"40\" r=\"25\" fill=\"#9d5025\"/><text x=\"40\" y=\"45\" text-anchor=\"middle\" font-size=\"10\" fill=\"#fff\" font-family=\"sans-serif\">IGW</text></svg>";

    private static string SvgAwsNat() =>
        "<svg viewBox=\"0 0 80 80\" fill=\"#fff\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"40\" cy=\"40\" r=\"35\" fill=\"#f58536\"/><rect x=\"25\" y=\"25\" width=\"30\" height=\"30\" fill=\"#9d5025\"/><text x=\"40\" y=\"45\" text-anchor=\"middle\" font-size=\"10\" fill=\"#fff\" font-family=\"sans-serif\">NAT</text></svg>";

    private static string SvgAwsSubnet(string color) =>
        $"<svg viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"3\" y=\"3\" width=\"34\" height=\"34\" rx=\"2\" fill=\"{color}\" fill-opacity=\"0.10\" stroke=\"{color}\" stroke-width=\"1.8\" stroke-dasharray=\"4 2\"/><rect x=\"10\" y=\"12\" width=\"20\" height=\"5\" rx=\"1\" fill=\"{color}\" fill-opacity=\"0.35\" stroke=\"none\"/><rect x=\"10\" y=\"19\" width=\"20\" height=\"5\" rx=\"1\" fill=\"{color}\" fill-opacity=\"0.20\" stroke=\"none\"/><text x=\"20\" y=\"32\" text-anchor=\"middle\" font-size=\"5.8\" fill=\"{color}\" font-family=\"sans-serif\" font-weight=\"600\">Subnet</text></svg>";

    private static string SvgAwsLambda() =>
        "<svg viewBox=\"0 0 80 80\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"0\" y=\"0\" width=\"80\" height=\"80\" fill=\"#FF9900\"/><path d=\"M28 66 L15 66 L29 37 L35 50 Z\" fill=\"#fff\"/><text x=\"40\" y=\"45\" text-anchor=\"middle\" font-size=\"12\" fill=\"#fff\" font-family=\"sans-serif\">Lambda</text></svg>";

    private static string PlaceholderRect(string color) =>
        $"<svg viewBox=\"0 0 40 40\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect x=\"4\" y=\"4\" width=\"32\" height=\"32\" rx=\"4\" fill=\"{color}\" fill-opacity=\"0.06\" stroke=\"{color}\" stroke-width=\"1.4\" stroke-dasharray=\"3 3\"/><text x=\"20\" y=\"24\" text-anchor=\"middle\" font-size=\"5.5\" fill=\"{color}\" font-family=\"sans-serif\">Soon</text></svg>";
}
