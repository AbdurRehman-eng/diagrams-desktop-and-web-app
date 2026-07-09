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
            e.Data.Properties["EdgeAttachment"] = item.EdgeAttachment;
            e.Data.Properties["EdgeContainerType"] = item.EdgeContainerType;
            e.Data.Properties["BaseShapeType"] = item.BaseShapeType;
        }
    }

    private double _initialCategoryListHeight;

    private void OnSplitterPanUpdated(object? sender, PanUpdatedEventArgs e)
    {
        if (BindingContext is ShapesPanelViewModel vm)
        {
            switch (e.StatusType)
            {
                case GestureStatus.Started:
                    _initialCategoryListHeight = vm.CategoryListHeight;
                    break;
                case GestureStatus.Running:
                    double newHeight = _initialCategoryListHeight + e.TotalY;
                    vm.CategoryListHeight = System.Math.Clamp(newHeight, 80.0, 400.0);
                    break;
            }
        }
    }
}
