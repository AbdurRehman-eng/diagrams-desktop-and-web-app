namespace DiagramsDesktop.Models;

public class ShapeCategory
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string Icon { get; set; } = "";
    public int DisplayOrder { get; set; } = 0;
    public bool IsPlaceholder { get; set; } = false;
    public string? PlaceholderMessage { get; set; }

    // ── Icon rendering helpers ────────────────────────────────────────────
    public string IconType => Id switch
    {
        "basic-shapes" => "rectangle",
        "aws"          => "aws-region",
        "azure"        => "azure-placeholder",
        "gcp"          => "gcp-placeholder",
        _              => "rectangle"
    };

    public string IconColor => Id switch
    {
        "basic-shapes" => "#6366f1",
        "aws"          => "#f59e0b",
        "azure"        => "#0ea5e9",
        "gcp"          => "#10b981",
        _              => "#6366f1"
    };

    // ── Count / "Soon" badge ─────────────────────────────────────────────
    /// <summary>Label shown in the badge chip on the category row.</summary>
    public string BadgeText => IsPlaceholder
        ? "Soon"
        : ShapeCategories.GetCategoryCount(Id).ToString();

    /// <summary>Background tint for the badge chip.</summary>
    public string BadgeColor => IsPlaceholder ? "#fef3c7" : "#e0e7ff";

    /// <summary>Text colour inside the badge chip.</summary>
    public string BadgeTextColor => IsPlaceholder ? "#d97706" : "#4f46e5";
}

