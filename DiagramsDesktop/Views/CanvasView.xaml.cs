using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;
using DiagramsDesktop.Models;
using DiagramsDesktop.Math;
using System;
using System.Linq;

namespace DiagramsDesktop.Views;

public partial class CanvasView : ContentView
{
    private readonly CanvasDrawable _drawable;
    private double _initialVCX;
    private double _initialVCY;
    private bool _isPanning;

    public static readonly BindableProperty DiagramProperty =
        BindableProperty.Create(nameof(Diagram), typeof(DiagramModel), typeof(CanvasView), null,
            propertyChanged: OnDiagramChanged);

    public static readonly BindableProperty SelectedShapeIdProperty =
        BindableProperty.Create(nameof(SelectedShapeId), typeof(string), typeof(CanvasView), null,
            defaultBindingMode: BindingMode.TwoWay,
            propertyChanged: OnSelectedShapeIdChanged);

    public CanvasView()
    {
        InitializeComponent();
        _drawable = new CanvasDrawable();
        CanvasGraphicsView.Drawable = _drawable;
    }

    public DiagramModel? Diagram
    {
        get => (DiagramModel?)GetValue(DiagramProperty);
        set => SetValue(DiagramProperty, value);
    }

    public string? SelectedShapeId
    {
        get => (string?)GetValue(SelectedShapeIdProperty);
        set => SetValue(SelectedShapeIdProperty, value);
    }

    private static void OnDiagramChanged(BindableObject bindable, object oldValue, object newValue)
    {
        if (bindable is CanvasView view)
        {
            view._drawable.Diagram = (DiagramModel?)newValue;
            view.Invalidate();
        }
    }

    private static void OnSelectedShapeIdChanged(BindableObject bindable, object oldValue, object newValue)
    {
        if (bindable is CanvasView view)
        {
            view._drawable.SelectedShapeId = newValue?.ToString();
            view.Invalidate();
        }
    }

    public void Invalidate()
    {
        CanvasGraphicsView.Invalidate();
    }

    // --- Tap / Selection Logic ---
    private void OnCanvasTapped(object? sender, TappedEventArgs e)
    {
        if (Diagram == null || Diagram.Canvas == null) return;

        var tapPos = e.GetPosition(CanvasGraphicsView);
        if (!tapPos.HasValue) return;

        double sx = tapPos.Value.X;
        double sy = tapPos.Value.Y;

        // Convert to World coordinates
        var (wx, wy) = ViewportMath.ScreenToWorld(
            sx, sy, 
            Diagram.Canvas, 
            CanvasGraphicsView.Width, 
            CanvasGraphicsView.Height
        );

        // Find shape under cursor (ordered by ZOrder descending so we hit top-most first)
        var clickedShape = Diagram.Shapes
            .Where(s => s.IsDeleted == 0)
            .OrderByDescending(s => s.ZOrder)
            .FirstOrDefault(s => IsPointInsideShape(wx, wy, s));

        SelectedShapeId = clickedShape?.ShapeID;
    }

    // --- Pointer / Hover Highlights ---
    private void OnCanvasPointerMoved(object? sender, PointerEventArgs e)
    {
        if (Diagram == null || Diagram.Canvas == null) return;

        var movePos = e.GetPosition(CanvasGraphicsView);
        if (!movePos.HasValue) return;

        double sx = movePos.Value.X;
        double sy = movePos.Value.Y;

        var (wx, wy) = ViewportMath.ScreenToWorld(
            sx, sy, 
            Diagram.Canvas, 
            CanvasGraphicsView.Width, 
            CanvasGraphicsView.Height
        );

        var hoveredShape = Diagram.Shapes
            .Where(s => s.IsDeleted == 0)
            .OrderByDescending(s => s.ZOrder)
            .FirstOrDefault(s => IsPointInsideShape(wx, wy, s));

        string? newHoverId = hoveredShape?.ShapeID;
        if (_drawable.HoveredShapeId != newHoverId)
        {
            _drawable.HoveredShapeId = newHoverId;
            Invalidate();
        }
    }

    // --- Viewport Panning ---
    private void OnCanvasPanUpdated(object? sender, PanUpdatedEventArgs e)
    {
        if (Diagram == null || Diagram.Canvas == null) return;

        var canvas = Diagram.Canvas;

        switch (e.StatusType)
        {
            case GestureStatus.Started:
                _initialVCX = canvas.ViewportCenterX;
                _initialVCY = canvas.ViewportCenterY;
                _isPanning = true;
                break;

            case GestureStatus.Running:
                if (_isPanning)
                {
                    // Calculate pan offset in world coordinates
                    var (dWX, dWY) = ViewportMath.CalculatePan(e.TotalX, e.TotalY, canvas.ZoomScale);
                    canvas.ViewportCenterX = _initialVCX + dWX;
                    canvas.ViewportCenterY = _initialVCY + dWY;
                    Invalidate();
                }
                break;

            case GestureStatus.Completed:
            case GestureStatus.Canceled:
                _isPanning = false;
                break;
        }
    }

    // --- Shape Dropping (Instantiate shapes from drag payload) ---
    private void OnShapeDropped(object? sender, DropEventArgs e)
    {
        if (Diagram == null || Diagram.Canvas == null) return;

        // Extract coordinates of the drop relative to the GraphicsView
        var dropPos = e.GetPosition(CanvasGraphicsView);
        if (!dropPos.HasValue) return;

        double sx = dropPos.Value.X;
        double sy = dropPos.Value.Y;

        // Convert screen coordinates to world space coordinates
        var (wx, wy) = ViewportMath.ScreenToWorld(
            sx, sy, 
            Diagram.Canvas, 
            CanvasGraphicsView.Width, 
            CanvasGraphicsView.Height
        );

        // Retrieve properties from drag package
        var props = e.Data.Properties;
        if (!props.ContainsKey("ShapeType")) return;

        string shapeType = props["ShapeType"]?.ToString() ?? "rectangle";
        string label = e.Data.Text ?? shapeType;
        string color = props.ContainsKey("ShapeColor") ? props["ShapeColor"]?.ToString() ?? "#6366f1" : "#6366f1";
        
        double defaultW = 100;
        double defaultH = 100;

        if (props.ContainsKey("ShapeWidth") && double.TryParse(props["ShapeWidth"]?.ToString(), out double dw))
        {
            defaultW = dw;
        }
        if (props.ContainsKey("ShapeHeight") && double.TryParse(props["ShapeHeight"]?.ToString(), out double dh))
        {
            defaultH = dh;
        }

        bool isContainer = false;
        if (props.ContainsKey("IsContainer") && bool.TryParse(props["IsContainer"]?.ToString(), out bool ic))
        {
            isContainer = ic;
        }

        // Instantiate new shape
        string newShapeId = "shape-" + Guid.NewGuid().ToString().Substring(0, 8);
        var newShape = new ShapeModel
        {
            ShapeID = newShapeId,
            Type = shapeType,
            Label = label,
            WorldX = wx,
            WorldY = wy,
            Width = defaultW,
            Height = defaultH,
            Color = color,
            StrokeColor = color,
            FillColor = color,
            DiagramID = Diagram.DiagramID,
            ZOrder = Diagram.Shapes.Count(s => s.IsDeleted == 0) + 1
        };

        if (shapeType == "circle" || shapeType == "aws-igw" || shapeType == "aws-nat")
        {
            newShape.Radius = defaultW / 2.0;
        }

        Diagram.Shapes.Add(newShape);
        SelectedShapeId = newShapeId;
        
        Invalidate();
    }

    // --- Helper Collision/Containment Tests ---
    private bool IsPointInsideShape(double wx, double wy, ShapeModel shape)
    {
        string type = shape.Type.ToLowerInvariant();
        bool isCircle = shape.Radius.HasValue || type == "circle" || type == "aws-igw" || type == "aws-nat";

        if (isCircle)
        {
            double r = shape.Radius ?? (shape.Width / 2.0);
            double dx = wx - shape.WorldX;
            double dy = wy - shape.WorldY;
            return (dx * dx + dy * dy) <= (r * r);
        }
        else // Rectangle/Line/Container
        {
            double minX = shape.WorldX - shape.Width / 2.0;
            double maxX = shape.WorldX + shape.Width / 2.0;
            double minY = shape.WorldY - shape.Height / 2.0;
            double maxY = shape.WorldY + shape.Height / 2.0;
            
            return wx >= minX && wx <= maxX && wy >= minY && wy <= maxY;
        }
    }
}
