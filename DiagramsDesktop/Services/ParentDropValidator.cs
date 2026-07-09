using System;
using System.Collections.Generic;
using System.Linq;
using DiagramsDesktop.Models;

namespace DiagramsDesktop.Services;

public static class ParentDropValidator
{
    private static readonly Dictionary<string, List<string>> ParentRules = new(StringComparer.OrdinalIgnoreCase)
    {
        { "aws-region", new List<string>() }, // null / root
        { "aws-vpc", new List<string> { "aws-region" } },
        { "aws-availability-zone", new List<string> { "aws-vpc" } },
        { "aws-route-table", new List<string> { "aws-availability-zone", "aws-vpc" } },
        { "aws-subnet", new List<string> { "aws-availability-zone" } },
        { "aws-ec2", new List<string> { "aws-subnet" } },
        { "aws-nat", new List<string> { "aws-availability-zone", "aws-vpc" } },
        { "aws-lambda", new List<string> { "aws-subnet" } }
    };

    public static (bool Ok, string? Reason) Validate(string itemType, string itemLabel, double worldX, double worldY, List<ShapeModel> currentShapes)
    {
        if (string.IsNullOrEmpty(itemType))
            return (false, "Unknown shape type.");

        // Check if there is a parent constraint for this type
        if (!ParentRules.TryGetValue(itemType, out var requiredParents) || requiredParents.Count == 0)
        {
            // Root-level shape: check if it overlaps another shape of the same type
            var overlapping = ShapesAt(worldX, worldY, currentShapes);
            var conflict = overlapping.FirstOrDefault(s => s.Type.Equals(itemType, StringComparison.OrdinalIgnoreCase));
            if (conflict != null)
            {
                return (false, $"Cannot overlap two \"{itemLabel}\" shapes.");
            }
            return (true, null);
        }

        // Child shape: must be dropped inside one of the required parent types
        // Find all shapes containing the drop point
        var containing = currentShapes
            .Where(s => s.IsDeleted == 0 && PointInsideShape(worldX, worldY, s))
            .OrderBy(s => s.Width * s.Height) // smallest area first (innermost container)
            .ToList();

        if (containing.Count == 0)
        {
            string parentLabels = string.Join(" or ", requiredParents.Select(t => $"\"{GetFriendlyLabel(t)}\""));
            return (false, $"\"{itemLabel}\" must be placed inside a {parentLabels}.");
        }

        // The immediate parent is the smallest containing shape
        var immediateParent = containing[0];

        // Check if immediate parent is a valid parent type
        if (!requiredParents.Any(t => immediateParent.Type.Equals(t, StringComparison.OrdinalIgnoreCase)))
        {
            string parentLabels = string.Join(" or ", requiredParents.Select(t => $"\"{GetFriendlyLabel(t)}\""));
            return (false, $"\"{itemLabel}\" cannot be placed inside a \"{immediateParent.Label}\". It must be placed inside a {parentLabels}.");
        }

        return (true, null);
    }

    private static List<ShapeModel> ShapesAt(double wx, double wy, List<ShapeModel> shapes)
    {
        return shapes.Where(s => s.IsDeleted == 0 && PointInsideShape(wx, wy, s)).ToList();
    }

    private static bool PointInsideShape(double wx, double wy, ShapeModel shape)
    {
        double hw = shape.Width / 2.0;
        double hh = shape.Height / 2.0;
        return wx >= shape.WorldX - hw && wx <= shape.WorldX + hw &&
               wy >= shape.WorldY - hh && wy <= shape.WorldY + hh;
    }

    private static string GetFriendlyLabel(string type)
    {
        switch (type.ToLowerInvariant())
        {
            case "aws-region": return "Region";
            case "aws-vpc": return "VPC";
            case "aws-availability-zone": return "Availability Zone";
            case "aws-route-table": return "Route Table";
            case "aws-subnet": return "AWS Subnet";
            case "aws-ec2": return "EC2";
            case "aws-nat": return "NAT Gateway";
            case "aws-lambda": return "AWS Lambda";
            default: return type;
        }
    }
}
