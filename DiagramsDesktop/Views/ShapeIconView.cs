using Microsoft.Maui.Controls;
using DiagramsDesktop.Math;

namespace DiagramsDesktop.Views;

public class ShapeIconView : GraphicsView
{
    private readonly ShapeIconDrawable _drawable;

    public static readonly BindableProperty ShapeTypeProperty =
        BindableProperty.Create(nameof(ShapeType), typeof(string), typeof(ShapeIconView), "",
            propertyChanged: OnShapeTypeChanged);

    public static readonly BindableProperty ColorHexProperty =
        BindableProperty.Create(nameof(ColorHex), typeof(string), typeof(ShapeIconView), "#6366f1",
            propertyChanged: OnColorHexChanged);

    public ShapeIconView()
    {
        _drawable = new ShapeIconDrawable();
        Drawable = _drawable;
        
        // Ensure default size if not specified
        WidthRequest = 40;
        HeightRequest = 40;
    }

    public string ShapeType
    {
        get => (string)GetValue(ShapeTypeProperty);
        set => SetValue(ShapeTypeProperty, value);
    }

    public string ColorHex
    {
        get => (string)GetValue(ColorHexProperty);
        set => SetValue(ColorHexProperty, value);
    }

    private static void OnShapeTypeChanged(BindableObject bindable, object oldValue, object newValue)
    {
        if (bindable is ShapeIconView view)
        {
            view._drawable.ShapeType = newValue?.ToString() ?? "";
            view.Invalidate();
        }
    }

    private static void OnColorHexChanged(BindableObject bindable, object oldValue, object newValue)
    {
        if (bindable is ShapeIconView view)
        {
            view._drawable.ColorHex = newValue?.ToString() ?? "#6366f1";
            view.Invalidate();
        }
    }
}
