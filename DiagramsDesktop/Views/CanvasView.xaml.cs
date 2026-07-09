using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;
using DiagramsDesktop.Models;
using DiagramsDesktop.Math;
using DiagramsDesktop.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DiagramsDesktop.Views;

public partial class CanvasView : ContentView
{
    private readonly CanvasDrawable _drawable;
    private double _initialVCX;
    private double _initialVCY;
    private bool _isPanning;
    // Track last pointer position for drop coordinate calculation
    private double _lastPointerSX;
    private double _lastPointerSY;

    // Unified interaction fields
    private string _interactionMode = "None"; // "None", "Pan", "MoveShape", "MoveCOC", "ResizeCOC"
    private double _dragOffsetX;
    private double _dragOffsetY;
    private double _startShapeWX;
    private double _startShapeWY;
    private double _panStartSX;
    private double _panStartSY;
    private string? _draggedShapeId;
    private string? _draggedCocId;
    private string? _targetHandle; // "North", "South", "West", "East"
    private double _startRadius;

    public static readonly BindableProperty DiagramProperty =
        BindableProperty.Create(nameof(Diagram), typeof(DiagramModel), typeof(CanvasView), null,
            propertyChanged: OnDiagramChanged);

    public static readonly BindableProperty SelectedShapeIdProperty =
        BindableProperty.Create(nameof(SelectedShapeId), typeof(string), typeof(CanvasView), null,
            defaultBindingMode: BindingMode.TwoWay,
            propertyChanged: OnSelectedShapeIdChanged);

    public static readonly BindableProperty SelectedCircleOnContainerIdProperty =
        BindableProperty.Create(nameof(SelectedCircleOnContainerId), typeof(string), typeof(CanvasView), null,
            defaultBindingMode: BindingMode.TwoWay,
            propertyChanged: OnSelectedCircleOnContainerIdChanged);

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

    public string? SelectedCircleOnContainerId
    {
        get => (string?)GetValue(SelectedCircleOnContainerIdProperty);
        set => SetValue(SelectedCircleOnContainerIdProperty, value);
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

    private static void OnSelectedCircleOnContainerIdChanged(BindableObject bindable, object oldValue, object newValue)
    {
        if (bindable is CanvasView view)
        {
            view._drawable.SelectedCircleOnContainerId = newValue?.ToString();
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

        // 1. Check CircleOnContainers first (they are drawn on top)
        if (Diagram.CircleOnContainers != null)
        {
            var clickedCoc = Diagram.CircleOnContainers
                .Where(c => c.IsDeleted == 0)
                .OrderByDescending(c => c.ZOrder)
                .FirstOrDefault(c => {
                    double dx = wx - c.CenterX;
                    double dy = wy - c.CenterY;
                    return (dx * dx + dy * dy) <= (c.Radius * c.Radius);
                });

            if (clickedCoc != null)
            {
                SelectedCircleOnContainerId = clickedCoc.CircleOnContainerID;
                SelectedShapeId = null;
                return;
            }
        }

        // 2. Check ShapeModels
        var clickedShape = Diagram.Shapes
            .Where(s => s.IsDeleted == 0)
            .OrderByDescending(s => s.ZOrder)
            .FirstOrDefault(s => IsPointInsideShape(wx, wy, s));

        SelectedShapeId = clickedShape?.ShapeID;
        SelectedCircleOnContainerId = null;
    }

    // --- Pointer / Hover Highlights ---
    private void OnCanvasPointerMoved(object? sender, PointerEventArgs e)
    {
        if (Diagram == null || Diagram.Canvas == null) return;

        var movePos = e.GetPosition(CanvasGraphicsView);
        if (!movePos.HasValue) return;

        double sx = movePos.Value.X;
        double sy = movePos.Value.Y;

        // Save position for use in drop handler and drag start
        _lastPointerSX = sx;
        _lastPointerSY = sy;

        var (wx, wy) = ViewportMath.ScreenToWorld(
            sx, sy, 
            Diagram.Canvas, 
            CanvasGraphicsView.Width, 
            CanvasGraphicsView.Height
        );

        // 1. Check COC hover
        if (Diagram.CircleOnContainers != null)
        {
            var hoveredCoc = Diagram.CircleOnContainers
                .Where(c => c.IsDeleted == 0)
                .OrderByDescending(c => c.ZOrder)
                .FirstOrDefault(c => {
                    double dx = wx - c.CenterX;
                    double dy = wy - c.CenterY;
                    return (dx * dx + dy * dy) <= (c.Radius * c.Radius);
                });

            if (hoveredCoc != null)
            {
                string? newHoverId = hoveredCoc.CircleOnContainerID;
                if (_drawable.HoveredCircleOnContainerId != newHoverId)
                {
                    _drawable.HoveredCircleOnContainerId = newHoverId;
                    _drawable.HoveredShapeId = null;
                    Invalidate();
                }
                return;
            }
        }

        // 2. Check Shape hover
        var hoveredShape = Diagram.Shapes
            .Where(s => s.IsDeleted == 0)
            .OrderByDescending(s => s.ZOrder)
            .FirstOrDefault(s => IsPointInsideShape(wx, wy, s));

        string? newShapeHoverId = hoveredShape?.ShapeID;
        if (_drawable.HoveredShapeId != newShapeHoverId || _drawable.HoveredCircleOnContainerId != null)
        {
            _drawable.HoveredShapeId = newShapeHoverId;
            _drawable.HoveredCircleOnContainerId = null;
            Invalidate();
        }
    }

    // --- Viewport Panning & Object Dragging ---
    private async void OnCanvasPanUpdated(object? sender, PanUpdatedEventArgs e)
    {
        if (Diagram == null || Diagram.Canvas == null) return;

        var canvas = Diagram.Canvas;
        double width = CanvasGraphicsView.Width;
        double height = CanvasGraphicsView.Height;

        switch (e.StatusType)
        {
            case GestureStatus.Started:
                _panStartSX = _lastPointerSX;
                _panStartSY = _lastPointerSY;

                var (startWX, startWY) = ViewportMath.ScreenToWorld(_panStartSX, _panStartSY, canvas, width, height);

                // A. Check if clicking selected COC's resize handles
                if (!string.IsNullOrEmpty(SelectedCircleOnContainerId))
                {
                    var selectedCoc = Diagram.CircleOnContainers.FirstOrDefault(c => c.CircleOnContainerID == SelectedCircleOnContainerId && c.IsDeleted == 0);
                    if (selectedCoc != null && selectedCoc.RadiusResizeEnabled == 1)
                    {
                        var handle = GetCircleOnContainerResizeHandle(startWX, startWY, selectedCoc, canvas);
                        if (handle != null)
                        {
                            _interactionMode = "ResizeCOC";
                            _draggedCocId = selectedCoc.CircleOnContainerID;
                            _targetHandle = handle;
                            _startRadius = selectedCoc.Radius;
                            break;
                        }
                    }
                }

                // B. Check if clicking over a CircleOnContainer to drag it
                if (Diagram.CircleOnContainers != null)
                {
                    var clickedCoc = Diagram.CircleOnContainers
                        .Where(c => c.IsDeleted == 0)
                        .OrderByDescending(c => c.ZOrder)
                        .FirstOrDefault(c => {
                            double dx = startWX - c.CenterX;
                            double dy = startWY - c.CenterY;
                            return (dx * dx + dy * dy) <= (c.Radius * c.Radius);
                        });

                    if (clickedCoc != null)
                    {
                        _interactionMode = "MoveCOC";
                        _draggedCocId = clickedCoc.CircleOnContainerID;
                        _dragOffsetX = clickedCoc.CenterX - startWX;
                        _dragOffsetY = clickedCoc.CenterY - startWY;
                        break;
                    }
                }

                // C. Check if clicking over a Shape to drag it
                var clickedShape = Diagram.Shapes
                    .Where(s => s.IsDeleted == 0)
                    .OrderByDescending(s => s.ZOrder)
                    .FirstOrDefault(s => IsPointInsideShape(startWX, startWY, s));

                if (clickedShape != null)
                {
                    _interactionMode = "MoveShape";
                    _draggedShapeId = clickedShape.ShapeID;
                    _dragOffsetX = clickedShape.WorldX - startWX;
                    _dragOffsetY = clickedShape.WorldY - startWY;
                    _startShapeWX = clickedShape.WorldX;
                    _startShapeWY = clickedShape.WorldY;
                    break;
                }

                // D. Otherwise, pan the viewport
                _interactionMode = "Pan";
                _initialVCX = canvas.ViewportCenterX;
                _initialVCY = canvas.ViewportCenterY;
                break;

            case GestureStatus.Running:
                var (currWX, currWY) = ViewportMath.ScreenToWorld(_panStartSX + e.TotalX, _panStartSY + e.TotalY, canvas, width, height);

                if (_interactionMode == "Pan")
                {
                    var (dWX, dWY) = ViewportMath.CalculatePan(e.TotalX, e.TotalY, canvas.ZoomScale);
                    canvas.ViewportCenterX = _initialVCX + dWX;
                    canvas.ViewportCenterY = _initialVCY + dWY;
                    Invalidate();
                }
                else if (_interactionMode == "MoveShape" && !string.IsNullOrEmpty(_draggedShapeId))
                {
                    var shape = Diagram.Shapes.FirstOrDefault(s => s.ShapeID == _draggedShapeId && s.IsDeleted == 0);
                    if (shape != null)
                    {
                        double targetWX = currWX + _dragOffsetX;
                        double targetWY = currWY + _dragOffsetY;

                        // Check if shape has parent in tree and clamp boundaries
                        if (!string.IsNullOrEmpty(shape.ParentContainerID))
                        {
                            var parent = Diagram.Shapes.FirstOrDefault(s => s.ShapeID == shape.ParentContainerID && s.IsDeleted == 0);
                            if (parent != null)
                            {
                                double parentHW = parent.Width / 2.0;
                                double parentHH = parent.Height / 2.0;
                                double hw = shape.Width / 2.0;
                                double hh = shape.Height / 2.0;

                                double minX = parent.WorldX - parentHW + hw;
                                double maxX = parent.WorldX + parentHW - hw;
                                double minY = parent.WorldY - parentHH + hh;
                                double maxY = parent.WorldY + parentHH - hh;

                                if (minX < maxX) targetWX = System.Math.Clamp(targetWX, minX, maxX);
                                if (minY < maxY) targetWY = System.Math.Clamp(targetWY, minY, maxY);
                            }
                        }

                        shape.WorldX = targetWX;
                        shape.WorldY = targetWY;
                        Invalidate();
                    }
                }
                else if (_interactionMode == "MoveCOC" && !string.IsNullOrEmpty(_draggedCocId))
                {
                    var coc = Diagram.CircleOnContainers.FirstOrDefault(c => c.CircleOnContainerID == _draggedCocId && c.IsDeleted == 0);
                    if (coc != null && !string.IsNullOrEmpty(coc.ParentContainerID))
                    {
                        var parent = Diagram.Shapes.FirstOrDefault(s => s.ShapeID == coc.ParentContainerID && s.IsDeleted == 0);
                        if (parent != null)
                        {
                            var (edge, t, cx, cy) = CircleOnContainerMath.ProjectWithCornerTransition(
                                currWX + _dragOffsetX,
                                currWY + _dragOffsetY,
                                parent,
                                coc.HostEdge
                            );

                            coc.HostEdge = edge;
                            coc.EdgeParameterT = t;
                            coc.CenterX = cx;
                            coc.CenterY = cy;
                            Invalidate();
                        }
                    }
                }
                else if (_interactionMode == "ResizeCOC" && !string.IsNullOrEmpty(_draggedCocId))
                {
                    var coc = Diagram.CircleOnContainers.FirstOrDefault(c => c.CircleOnContainerID == _draggedCocId && c.IsDeleted == 0);
                    if (coc != null)
                    {
                        double newRadius = _startRadius;
                        switch (_targetHandle)
                        {
                            case "North": newRadius = System.Math.Abs(currWY - coc.CenterY); break;
                            case "South": newRadius = System.Math.Abs(coc.CenterY - currWY); break;
                            case "West":  newRadius = System.Math.Abs(coc.CenterX - currWX); break;
                            case "East":  newRadius = System.Math.Abs(currWX - coc.CenterX); break;
                        }
                        coc.Radius = System.Math.Clamp(newRadius, 10.0, 100.0);
                        Invalidate();
                    }
                }
                break;

            case GestureStatus.Completed:
            case GestureStatus.Canceled:
                if (_interactionMode == "MoveShape" && !string.IsNullOrEmpty(_draggedShapeId))
                {
                    var shape = Diagram.Shapes.FirstOrDefault(s => s.ShapeID == _draggedShapeId && s.IsDeleted == 0);
                    if (shape != null)
                    {
                        // Run hierarchical drop validation to ensure containment is legal
                        var validation = ParentDropValidator.Validate(shape.Type, shape.Label, shape.WorldX, shape.WorldY, Diagram.Shapes.Where(s => s.ShapeID != shape.ShapeID).ToList());
                        if (!validation.Ok)
                        {
                            // Revert position on failure
                            shape.WorldX = _startShapeWX;
                            shape.WorldY = _startShapeWY;
                            Invalidate();
                            await Shell.Current.DisplayAlert("Validation Warning", validation.Reason, "OK");
                        }
                        else
                        {
                            // Find matching smallest container
                            var immediateParent = Diagram.Shapes
                                .Where(s => s.IsDeleted == 0 && s.ShapeID != shape.ShapeID && IsPointInsideShape(shape.WorldX, shape.WorldY, s))
                                .OrderBy(s => s.Width * s.Height)
                                .FirstOrDefault();
                            shape.ParentContainerID = immediateParent?.ShapeID;
                        }
                    }
                }

                _interactionMode = "None";
                _draggedShapeId = null;
                _draggedCocId = null;
                _targetHandle = null;
                break;
        }
    }

    // --- Shape Dropping (Instantiate shapes from drag payload) ---
    private async void OnShapeDropped(object? sender, DropEventArgs e)
    {
        if (Diagram == null || Diagram.Canvas == null) return;

        // Use last tracked pointer position
        double sx = _lastPointerSX > 0 ? _lastPointerSX : CanvasGraphicsView.Width / 2.0;
        double sy = _lastPointerSY > 0 ? _lastPointerSY : CanvasGraphicsView.Height / 2.0;

        // Convert screen coordinates to world space coordinates
        var (wx, wy) = ViewportMath.ScreenToWorld(
            sx, sy, 
            Diagram.Canvas, 
            CanvasGraphicsView.Width, 
            CanvasGraphicsView.Height
        );

        // Retrieve properties from drag data package
        var props = e.Data.Properties;
        if (!props.ContainsKey("ShapeType")) return;

        string shapeType = props["ShapeType"]?.ToString() ?? "rectangle";
        string label = props.ContainsKey("ShapeLabel") ? props["ShapeLabel"]?.ToString() ?? shapeType : shapeType;
        string color = props.ContainsKey("ShapeColor") ? props["ShapeColor"]?.ToString() ?? "#6366f1" : "#6366f1";
        
        double defaultW = 100;
        double defaultH = 100;

        if (props.ContainsKey("ShapeWidth") && double.TryParse(props["ShapeWidth"]?.ToString(), out double dw))
            defaultW = dw;
        if (props.ContainsKey("ShapeHeight") && double.TryParse(props["ShapeHeight"]?.ToString(), out double dh))
            defaultH = dh;

        bool isContainer = false;
        if (props.ContainsKey("IsContainer") && bool.TryParse(props["IsContainer"]?.ToString(), out bool ic))
            isContainer = ic;

        bool isEdgeAttachment = false;
        if (props.ContainsKey("EdgeAttachment") && bool.TryParse(props["EdgeAttachment"]?.ToString(), out bool ea))
            isEdgeAttachment = ea;
        else if (shapeType.Equals("aws-igw", StringComparison.OrdinalIgnoreCase))
            isEdgeAttachment = true;

        if (isEdgeAttachment)
        {
            // Find nearest AWS VPC container
            ShapeModel? bestVpc = null;
            double bestArea = double.PositiveInfinity;
            foreach (var shape in Diagram.Shapes.Where(s => s.IsDeleted == 0))
            {
                if (!shape.Type.Equals("aws-vpc", StringComparison.OrdinalIgnoreCase) && !IsContainerShape(shape.Type)) continue;

                // Check distance to boundaries with padding
                double pad = 35.0; // Snapping zone padding
                double hw = shape.Width / 2.0 + pad;
                double hh = shape.Height / 2.0 + pad;

                bool inBounds = wx >= shape.WorldX - hw && wx <= shape.WorldX + hw &&
                                wy >= shape.WorldY - hh && wy <= shape.WorldY + hh;

                if (inBounds)
                {
                    double area = shape.Width * shape.Height;
                    if (area < bestArea)
                    {
                        bestArea = area;
                        bestVpc = shape;
                    }
                }
            }

            if (bestVpc == null)
            {
                await Shell.Current.DisplayAlert("Validation Error", "Edge devices (Internet Gateway) must be dropped onto an AWS VPC container edge.", "OK");
                return;
            }

            // Project to VPC container edge
            var (edge, t, cx, cy) = CircleOnContainerMath.Project(wx, wy, bestVpc);

            // Instantiate CircleOnContainerModel
            string newCocId = "coc-" + Guid.NewGuid().ToString().Substring(0, 8);
            var newCoc = new CircleOnContainerModel
            {
                CircleOnContainerID = newCocId,
                DiagramID = Diagram.DiagramID,
                ParentContainerID = bestVpc.ShapeID,
                DeviceOnContainerEdgeType = label,
                ParentContainerType = "VPC",
                HostEdge = edge,
                EdgeParameterT = t,
                CenterX = cx,
                CenterY = cy,
                Radius = 25.0,
                Label = label,
                FillColor = color,
                LineColor = color,
                LineWidth = 2.0,
                RadiusResizeEnabled = 1,
                ZOrder = (Diagram.CircleOnContainers?.Count(c => c.IsDeleted == 0) ?? 0) + 1
            };

            if (Diagram.CircleOnContainers == null)
            {
                Diagram.CircleOnContainers = new List<CircleOnContainerModel>();
            }

            Diagram.CircleOnContainers.Add(newCoc);
            SelectedCircleOnContainerId = newCocId;
            SelectedShapeId = null;
            Invalidate();
        }
        else
        {
            // Run hierarchical drop validation to ensure containment is legal
            var validation = ParentDropValidator.Validate(shapeType, label, wx, wy, Diagram.Shapes);
            if (!validation.Ok)
            {
                await Shell.Current.DisplayAlert("Validation Error", validation.Reason, "OK");
                return;
            }

            // Find immediate smallest container shape
            var immediateParent = Diagram.Shapes
                .Where(s => s.IsDeleted == 0 && IsPointInsideShape(wx, wy, s))
                .OrderBy(s => s.Width * s.Height)
                .FirstOrDefault();

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
                ParentContainerID = immediateParent?.ShapeID,
                DiagramID = Diagram.DiagramID,
                ZOrder = Diagram.Shapes.Count(s => s.IsDeleted == 0) + 1
            };

            if (shapeType == "circle" || shapeType == "aws-igw" || shapeType == "aws-nat")
                newShape.Radius = defaultW / 2.0;

            Diagram.Shapes.Add(newShape);
            SelectedShapeId = newShapeId;
            SelectedCircleOnContainerId = null;
            Invalidate();
        }

        await Task.CompletedTask;
    }

    private string? GetCircleOnContainerResizeHandle(double wx, double wy, CircleOnContainerModel coc, CanvasModel canvas)
    {
        double zoom = canvas.ZoomScale;
        double threshold = 12.0 / zoom; // ~12 screen pixels

        double r = coc.Radius;
        double cx = coc.CenterX;
        double cy = coc.CenterY;

        // North: (cx, cy + r)
        // South: (cx, cy - r)
        // West: (cx - r, cy)
        // East: (cx + r, cy)
        if (System.Math.Abs(wx - cx) < threshold && System.Math.Abs(wy - (cy + r)) < threshold) return "North";
        if (System.Math.Abs(wx - cx) < threshold && System.Math.Abs(wy - (cy - r)) < threshold) return "South";
        if (System.Math.Abs(wx - (cx - r)) < threshold && System.Math.Abs(wy - cy) < threshold) return "West";
        if (System.Math.Abs(wx - (cx + r)) < threshold && System.Math.Abs(wy - cy) < threshold) return "East";

        return null;
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

    private bool IsContainerShape(string type)
    {
        string t = type.ToLowerInvariant();
        return t == "aws-region" || t == "aws-vpc" || t == "aws-availability-zone" || t == "aws-subnet";
    }
}
