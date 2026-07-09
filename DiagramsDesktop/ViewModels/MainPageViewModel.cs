using System;
using System.IO;
using System.Linq;
using System.Windows.Input;
using System.Threading.Tasks;
using Microsoft.Maui.Storage;
using DiagramsDesktop.Models;
using DiagramsDesktop.Math;
using DiagramsDesktop.Services;

namespace DiagramsDesktop.ViewModels;

public class MainPageViewModel : BaseViewModel
{
    private DiagramModel _activeDiagram = null!;
    private ShapesPanelViewModel _shapesPanelVM;
    private ShapeModel? _selectedShape;
    private string? _selectedShapeId;
    private string _diagramTitle = "Untitled Diagram";
    private string _currentTool = "select";   // "select" | "connect"
    private readonly DatabasePersistenceService _dbService;
    private readonly JsonPersistenceService _jsonService;

    public MainPageViewModel()
    {
        _dbService = new DatabasePersistenceService();
        _jsonService = new JsonPersistenceService();
        _shapesPanelVM = new ShapesPanelViewModel();

        // Commands
        NewDiagramCommand    = new RelayCommand(NewDiagram);
        SaveDiagramCommand   = new RelayCommand(async () => await SaveDiagramAsync());
        LoadDiagramCommand   = new RelayCommand(async () => await LoadDiagramAsync());
        ImportJsonCommand    = new RelayCommand(async () => await ImportJsonAsync());
        ExportJsonCommand    = new RelayCommand(async () => await ExportJsonAsync());
        ZoomInCommand        = new RelayCommand(ZoomIn);
        ZoomOutCommand       = new RelayCommand(ZoomOut);
        ZoomResetCommand     = new RelayCommand(ZoomReset);
        FitToScreenCommand   = new RelayCommand(FitToScreen);
        SelectToolCommand    = new RelayCommand(() => SetTool("select"));
        ConnectToolCommand   = new RelayCommand(() => SetTool("connect"));
        UndoCommand          = new RelayCommand(() => { /* Phase 2 */ });
        RedoCommand          = new RelayCommand(() => { /* Phase 2 */ });

        // Start with a new diagram
        NewDiagram();
    }

    public DiagramModel ActiveDiagram
    {
        get => _activeDiagram;
        set
        {
            if (SetProperty(ref _activeDiagram, value))
            {
                OnPropertyChanged(nameof(Canvas));
                DiagramTitle = _activeDiagram.DiagramName;
            }
        }
    }

    public CanvasModel Canvas => ActiveDiagram?.Canvas!;

    public ShapesPanelViewModel ShapesPanelVM
    {
        get => _shapesPanelVM;
        set => SetProperty(ref _shapesPanelVM, value);
    }

    public string DiagramTitle
    {
        get => _diagramTitle;
        set
        {
            if (SetProperty(ref _diagramTitle, value))
            {
                if (ActiveDiagram != null)
                {
                    ActiveDiagram.DiagramName = value;
                }
            }
        }
    }

    public string? SelectedShapeId
    {
        get => _selectedShapeId;
        set
        {
            if (SetProperty(ref _selectedShapeId, value))
            {
                SelectedShape = ActiveDiagram?.Shapes?.FirstOrDefault(s => s.ShapeID == value);
            }
        }
    }

    public ShapeModel? SelectedShape
    {
        get => _selectedShape;
        set
        {
            if (SetProperty(ref _selectedShape, value))
            {
                OnPropertyChanged(nameof(HasSelectedShape));
            }
        }
    }

    public bool HasSelectedShape => SelectedShape != null;

    // View bounds passed from UI for viewport math
    public double CanvasViewWidth { get; set; } = 800;
    public double CanvasViewHeight { get; set; } = 600;

    // Action hook to trigger canvas repaint from ViewModel
    public Action? RequestCanvasRepaint { get; set; }

    // ── Tool mode ─────────────────────────────────────────────────────────
    public string CurrentTool
    {
        get => _currentTool;
        private set
        {
            if (SetProperty(ref _currentTool, value))
            {
                OnPropertyChanged(nameof(IsSelectToolActive));
                OnPropertyChanged(nameof(IsConnectToolActive));
            }
        }
    }
    public bool IsSelectToolActive  => CurrentTool == "select";
    public bool IsConnectToolActive => CurrentTool == "connect";

    private void SetTool(string tool) => CurrentTool = tool;

    // ── Status bar ────────────────────────────────────────────────────────
    public string ZoomPercent
    {
        get
        {
            if (Canvas == null) return "100%";
            return $"{(int)(Canvas.ZoomScale * 100)}%";
        }
    }

    public string ShapeCount
    {
        get
        {
            var count = ActiveDiagram?.Shapes?.Count(s => s.IsDeleted == 0) ?? 0;
            return $"{count} shape{(count == 1 ? "" : "s")}";
        }
    }

    public string WorldCoords
    {
        get
        {
            if (Canvas == null) return "[0, 0]";
            return $"[{(int)Canvas.ViewportCenterX}, {(int)Canvas.ViewportCenterY}]";
        }
    }

    public string ActiveCategoryName => ShapesPanelVM?.SelectedCategory?.Name ?? "—";

    /// <summary>Refreshes all status-bar bindings. Call after any canvas state change.</summary>
    private void NotifyStatusBar()
    {
        OnPropertyChanged(nameof(ZoomPercent));
        OnPropertyChanged(nameof(ShapeCount));
        OnPropertyChanged(nameof(WorldCoords));
    }

    // Commands
    public ICommand NewDiagramCommand  { get; }
    public ICommand SaveDiagramCommand { get; }
    public ICommand LoadDiagramCommand { get; }
    public ICommand ImportJsonCommand  { get; }
    public ICommand ExportJsonCommand  { get; }
    public ICommand ZoomInCommand      { get; }
    public ICommand ZoomOutCommand     { get; }
    public ICommand ZoomResetCommand   { get; }
    public ICommand FitToScreenCommand { get; }
    public ICommand SelectToolCommand  { get; }
    public ICommand ConnectToolCommand { get; }
    public ICommand UndoCommand        { get; }
    public ICommand RedoCommand        { get; }

    private void NewDiagram()
    {
        var diagramId = "diagram-" + Guid.NewGuid().ToString().Substring(0, 8);
        var canvasId = "canvas-" + Guid.NewGuid().ToString().Substring(0, 8);

        ActiveDiagram = new DiagramModel
        {
            DiagramID = diagramId,
            DiagramName = "Untitled Diagram",
            DiagramVersion = 1,
            Canvas = new CanvasModel
            {
                CanvasID = canvasId,
                CanvasName = "Main Canvas",
                BackgroundColor = "#f1f5f9",
                CoordinateSystemType = "Cartesian",
                OriginDefinition = "Center",
                AxisOrientationX = "Right",
                AxisOrientationY = "Down",
                AxisOrientationZ = "In",
                IsInfiniteX = true,
                IsInfiniteY = true,
                IsInfiniteZ = true,
                ViewportCenterX = 0,
                ViewportCenterY = 0,
                ViewportWidth = 2000,
                ViewportHeight = 2000,
                ZoomScale = 1.0,
                GridVisible = true,
                GridColor = "#e2e8f0",
                GridSpacingX = 25,
                GridSpacingY = 25,
                ShowOriginMarker = true,
                ShowAxes = true,
                PanEnabled = true,
                ZoomEnabled = true
            }
        };

        SelectedShapeId = null;
        NotifyStatusBar();
        RequestCanvasRepaint?.Invoke();
    }

    private async Task SaveDiagramAsync()
    {
        try
        {
            await Task.Run(() => _dbService.SaveDiagram(ActiveDiagram));
            await Application.Current!.MainPage!.DisplayAlert("Success", "Diagram saved to SQLite database successfully.", "OK");
        }
        catch (Exception ex)
        {
            await Application.Current!.MainPage!.DisplayAlert("Error", $"Failed to save diagram: {ex.Message}", "OK");
        }
    }

    private async Task LoadDiagramAsync()
    {
        try
        {
            var diagrams = await Task.Run(() => _dbService.ListDiagrams());
            if (!diagrams.Any())
            {
                await Application.Current!.MainPage!.DisplayAlert("Info", "No saved diagrams found in the database.", "OK");
                return;
            }

            var titles = diagrams.Select(d => $"{d.DiagramName} ({d.DiagramID})").ToArray();
            string selected = await Application.Current!.MainPage!.DisplayActionSheet("Open Diagram", "Cancel", null, titles);
            
            if (string.IsNullOrEmpty(selected) || selected == "Cancel") return;

            int index = Array.IndexOf(titles, selected);
            if (index >= 0)
            {
                var fullDiagram = await Task.Run(() => _dbService.LoadDiagram(diagrams[index].DiagramID));
                if (fullDiagram != null)
                {
                    ActiveDiagram = fullDiagram;
                    SelectedShapeId = null;
                    RequestCanvasRepaint?.Invoke();
                }
            }
        }
        catch (Exception ex)
        {
            await Application.Current!.MainPage!.DisplayAlert("Error", $"Failed to load diagram: {ex.Message}", "OK");
        }
    }

    private async Task ImportJsonAsync()
    {
        try
        {
            var customFileType = new FilePickerFileType(
                new Dictionary<DevicePlatform, IEnumerable<string>>
                {
                    { DevicePlatform.WinUI, new[] { ".json" } },
                    { DevicePlatform.macOS, new[] { "json" } },
                    { DevicePlatform.Android, new[] { "application/json" } },
                    { DevicePlatform.iOS, new[] { "public.json" } }
                });

            PickOptions options = new()
            {
                PickerTitle = "Select Diagram JSON File",
                FileTypes = customFileType,
            };

            var result = await FilePicker.Default.PickAsync(options);
            if (result != null)
            {
                using var stream = await result.OpenReadAsync();
                using var reader = new StreamReader(stream);
                string jsonText = await reader.ReadToEndAsync();
                
                var imported = _jsonService.DeserializeDiagram(jsonText);
                if (imported != null)
                {
                    ActiveDiagram = imported;
                    SelectedShapeId = null;
                    RequestCanvasRepaint?.Invoke();
                }
            }
        }
        catch (Exception ex)
        {
            await Application.Current!.MainPage!.DisplayAlert("Error", $"Failed to import JSON: {ex.Message}", "OK");
        }
    }

    private async Task ExportJsonAsync()
    {
        try
        {
            string jsonText = _jsonService.SerializeDiagram(ActiveDiagram);
            string fileName = $"{ActiveDiagram.DiagramName.Replace(" ", "_")}.json";
            
            // On desktop, save via file saver or dump to desktop / document folder
            string targetPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments), fileName);
            await File.WriteAllTextAsync(targetPath, jsonText);

            await Application.Current!.MainPage!.DisplayAlert("Export Successful", $"Diagram exported to:\n{targetPath}", "OK");
        }
        catch (Exception ex)
        {
            await Application.Current!.MainPage!.DisplayAlert("Error", $"Failed to export JSON: {ex.Message}", "OK");
        }
    }

    private void ZoomIn()
    {
        if (Canvas == null) return;
        var (newZoom, newVCX, newVCY) = ViewportMath.CalculateZoom(
            Canvas.ZoomScale, 
            1, 
            CanvasViewWidth / 2.0, 
            CanvasViewHeight / 2.0, 
            CanvasViewWidth, 
            CanvasViewHeight, 
            Canvas
        );
        Canvas.ZoomScale = newZoom;
        if (newVCX.HasValue) Canvas.ViewportCenterX = newVCX.Value;
        if (newVCY.HasValue) Canvas.ViewportCenterY = newVCY.Value;
        NotifyStatusBar();
        RequestCanvasRepaint?.Invoke();
    }

    private void ZoomOut()
    {
        if (Canvas == null) return;
        var (newZoom, newVCX, newVCY) = ViewportMath.CalculateZoom(
            Canvas.ZoomScale, 
            -1, 
            CanvasViewWidth / 2.0, 
            CanvasViewHeight / 2.0, 
            CanvasViewWidth, 
            CanvasViewHeight, 
            Canvas
        );
        Canvas.ZoomScale = newZoom;
        if (newVCX.HasValue) Canvas.ViewportCenterX = newVCX.Value;
        if (newVCY.HasValue) Canvas.ViewportCenterY = newVCY.Value;
        NotifyStatusBar();
        RequestCanvasRepaint?.Invoke();
    }

    private void ZoomReset()
    {
        if (Canvas == null) return;
        Canvas.ZoomScale = 1.0;
        Canvas.ViewportCenterX = 0;
        Canvas.ViewportCenterY = 0;
        NotifyStatusBar();
        RequestCanvasRepaint?.Invoke();
    }

    private void FitToScreen()
    {
        if (Canvas == null || ActiveDiagram == null) return;

        var activeShapes = ActiveDiagram.Shapes.Where(s => s.IsDeleted == 0).ToList();
        if (!activeShapes.Any())
        {
            ZoomReset();
            return;
        }

        // Bounding box of shapes
        double minX = activeShapes.Min(s => s.WorldX - s.Width / 2.0);
        double maxX = activeShapes.Max(s => s.WorldX + s.Width / 2.0);
        double minY = activeShapes.Min(s => s.WorldY - s.Height / 2.0);
        double maxY = activeShapes.Max(s => s.WorldY + s.Height / 2.0);

        double w = maxX - minX;
        double h = maxY - minY;
        
        Canvas.ViewportCenterX = minX + w / 2.0;
        Canvas.ViewportCenterY = minY + h / 2.0;

        // Bounding box dimensions with 10% padding
        double padW = w * 1.1;
        double padH = h * 1.1;

        if (padW > 0 && padH > 0)
        {
            double scaleX = CanvasViewWidth / padW;
            double scaleY = CanvasViewHeight / padH;
            double targetZoom = System.Math.Min(scaleX, scaleY);

            // Clamp zoom scale
            Canvas.ZoomScale = System.Math.Clamp(targetZoom, CanvasConfig.MinZoom, CanvasConfig.MaxZoom);
        }

        RequestCanvasRepaint?.Invoke();
    }
}
