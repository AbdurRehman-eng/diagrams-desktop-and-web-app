using Microsoft.Maui.Controls;
using System;
using System.Globalization;

namespace DiagramsDesktop.Views;

/// <summary>
/// Converts a bool to one of two colour strings supplied in the ConverterParameter.
/// Usage: ConverterParameter="trueColor|falseColor"
/// </summary>
public class BoolToColorConverter : IValueConverter
{
    public static readonly BoolToColorConverter Instance = new();

    public object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        bool boolVal = value is bool b && b;
        string param = parameter as string ?? "#f8fafc|#f8fafc";
        var parts = param.Split('|');
        string hex = boolVal ? parts[0] : (parts.Length > 1 ? parts[1] : parts[0]);

        // Return Color for BackgroundColor / BorderColor, string for text color is auto-handled by MAUI
        return Color.FromArgb(hex);
    }

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
        => throw new NotSupportedException();
}
