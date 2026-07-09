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

        ShapesSidebar.BindingContext = _viewModel.ShapesPanelVM;

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

    private void OnFillColorTapped(object? sender, TappedEventArgs e)
    {
        if (_viewModel.SelectedShape != null && e.Parameter is string colorHex)
        {
            _viewModel.SelectedShape.FillColor = colorHex;
            MainCanvasView?.Invalidate();
        }
    }

    private void OnDeleteCocClicked(object? sender, EventArgs e)
    {
        if (_viewModel.SelectedCircleOnContainer != null)
        {
            _viewModel.SelectedCircleOnContainer.IsDeleted = 1;
            _viewModel.SelectedCircleOnContainerId = null;
            MainCanvasView?.Invalidate();
        }
    }

    private void OnCocFillColorTapped(object? sender, TappedEventArgs e)
    {
        if (_viewModel.SelectedCircleOnContainer != null && e.Parameter is string colorHex)
        {
            _viewModel.SelectedCircleOnContainer.FillColor = colorHex;
            _viewModel.SelectedCircleOnContainer.LineColor = colorHex;
            MainCanvasView?.Invalidate();
        }
    }

    private void OnFileButtonClicked(object? sender, EventArgs e)
    {
        FileDropdownOverlay.IsVisible = !FileDropdownOverlay.IsVisible;
        EditDropdownOverlay.IsVisible = false;
    }

    private void OnEditButtonClicked(object? sender, EventArgs e)
    {
        EditDropdownOverlay.IsVisible = !EditDropdownOverlay.IsVisible;
        FileDropdownOverlay.IsVisible = false;
    }

    private void OnCloseDropdowns(object? sender, TappedEventArgs e)
    {
        FileDropdownOverlay.IsVisible = false;
        EditDropdownOverlay.IsVisible = false;
    }

    private void OnDropdownItemClicked(object? sender, EventArgs e)
    {
        FileDropdownOverlay.IsVisible = false;
        EditDropdownOverlay.IsVisible = false;
    }
}
