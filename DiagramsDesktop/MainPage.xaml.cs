using Microsoft.Maui.Controls;
using DiagramsDesktop.ViewModels;
using System;

namespace DiagramsDesktop;

public partial class MainPage : ContentPage
{
    private readonly MainPageViewModel _viewModel;

    public MainPage()
    {
        InitializeComponent();
        _viewModel = new MainPageViewModel();
        BindingContext = _viewModel;

        // Repaint request hook
        _viewModel.RequestCanvasRepaint = () => MainCanvasView.Invalidate();
    }

    private void OnCanvasViewSizeChanged(object? sender, EventArgs e)
    {
        if (MainCanvasView != null)
        {
            _viewModel.CanvasViewWidth = MainCanvasView.Width;
            _viewModel.CanvasViewHeight = MainCanvasView.Height;
        }
    }

    private void OnPropertyModified(object? sender, TextChangedEventArgs e)
    {
        MainCanvasView?.Invalidate();
    }

    private void OnDeleteShapeClicked(object? sender, EventArgs e)
    {
        if (_viewModel.SelectedShape != null)
        {
            _viewModel.SelectedShape.IsDeleted = 1;
            _viewModel.SelectedShapeId = null;
            MainCanvasView?.Invalidate();
        }
    }
}
