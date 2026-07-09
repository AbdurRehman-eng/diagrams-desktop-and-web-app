using Microsoft.Maui.Controls;
using DiagramsDesktop.Models;
using DiagramsDesktop.ViewModels;

namespace DiagramsDesktop.Views;

public partial class ShapesPanel : ContentView
{
    public ShapesPanel()
    {
        InitializeComponent();
    }

    private void OnDragStarting(object? sender, DragStartingEventArgs e)
    {
        if (sender is Border border && border.BindingContext is ShapeLibraryItem item)
        {
            // Set the package payload values
            e.Data.Properties["ShapeId"] = item.Id;
            e.Data.Properties["ShapeType"] = item.Type;
            e.Data.Properties["ShapeLabel"] = item.Label;  // Use Properties, not Text
            e.Data.Properties["ShapeColor"] = item.FillColor;
            e.Data.Properties["ShapeWidth"] = item.DefaultWidth;
            e.Data.Properties["ShapeHeight"] = item.DefaultHeight;
            e.Data.Properties["IsContainer"] = item.IsContainer;
        }
    }
}
