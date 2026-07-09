using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Linq;
using System.Windows.Input;
using DiagramsDesktop.Models;

namespace DiagramsDesktop.ViewModels;

public class ShapesPanelViewModel : BaseViewModel
{
    private string _searchText = "";
    private ShapeCategory? _selectedCategory;
    private bool _isCollapsed;
    private ObservableCollection<ShapeLibraryItem> _filteredItems = new();
    private double _categoryListHeight = 180;

    public double CategoryListHeight
    {
        get => _categoryListHeight;
        set => SetProperty(ref _categoryListHeight, value);
    }

    public ShapesPanelViewModel()
    {
        Categories = ShapeCategories.LoadShapeCategories();
        SelectCategoryCommand = new RelayCommand<ShapeCategory>(SelectCategory);
        ToggleCollapseCommand = new RelayCommand(ToggleCollapse);
        ClearSearchCommand    = new RelayCommand(ClearSearch);

        // Default to the first non-placeholder category
        SelectedCategory = Categories.FirstOrDefault(c => !c.IsPlaceholder) ?? Categories.FirstOrDefault();
    }

    public List<ShapeCategory> Categories { get; }

    // ── Search ────────────────────────────────────────────────────────────────
    public string SearchText
    {
        get => _searchText;
        set
        {
            if (SetProperty(ref _searchText, value))
            {
                OnPropertyChanged(nameof(SearchHasText));
                RefreshFilteredItems();
            }
        }
    }

    /// <summary>True when search box has text → shows the ✕ clear button.</summary>
    public bool SearchHasText => !string.IsNullOrEmpty(_searchText);

    private void ClearSearch()
    {
        SearchText = "";
    }

    // ── Category ──────────────────────────────────────────────────────────────
    public ShapeCategory? SelectedCategory
    {
        get => _selectedCategory;
        set
        {
            if (SetProperty(ref _selectedCategory, value))
            {
                OnPropertyChanged(nameof(SelectedCategoryHeader));
                OnPropertyChanged(nameof(PlaceholderMessage));
                OnPropertyChanged(nameof(IsPlaceholderCategorySelected));
                OnPropertyChanged(nameof(IsStandardCategorySelected));
                RefreshFilteredItems();
            }
        }
    }

    public bool IsCollapsed
    {
        get => _isCollapsed;
        set
        {
            if (SetProperty(ref _isCollapsed, value))
            {
                OnPropertyChanged(nameof(IsExpanded));
                OnPropertyChanged(nameof(PanelWidth));
                OnPropertyChanged(nameof(ToggleButtonText));
            }
        }
    }

    public bool IsExpanded => !_isCollapsed;

    public double PanelWidth => IsExpanded ? 248 : 18;

    /// <summary>Chevron text that rotates when collapsed.</summary>
    public string ToggleButtonText => IsCollapsed ? "›" : "‹";

    public ObservableCollection<ShapeLibraryItem> FilteredItems
    {
        get => _filteredItems;
        set => SetProperty(ref _filteredItems, value);
    }

    public string SelectedCategoryHeader => SelectedCategory?.Name ?? "Shapes";

    public bool IsPlaceholderCategorySelected => SelectedCategory?.IsPlaceholder ?? false;
    public bool IsStandardCategorySelected    => !IsPlaceholderCategorySelected;

    public string PlaceholderMessage => SelectedCategory?.PlaceholderMessage ?? "";

    // ── Commands ──────────────────────────────────────────────────────────────
    public ICommand SelectCategoryCommand { get; }
    public ICommand ToggleCollapseCommand { get; }
    public ICommand ClearSearchCommand    { get; }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void SelectCategory(ShapeCategory category)
    {
        if (category != null) SelectedCategory = category;
    }

    private void ToggleCollapse() => IsCollapsed = !IsCollapsed;

    private void RefreshFilteredItems()
    {
        if (SelectedCategory == null)
        {
            FilteredItems.Clear();
            return;
        }

        var items = ShapeCategories.GetCategoryItems(SelectedCategory.Id);

        if (!string.IsNullOrWhiteSpace(SearchText))
        {
            string query = SearchText.Trim().ToLowerInvariant();
            items = items.Where(i =>
                (i.Label != null && i.Label.ToLowerInvariant().Contains(query)) ||
                (i.Type  != null && i.Type.ToLowerInvariant().Contains(query))
            ).ToList();
        }

        FilteredItems.Clear();
        foreach (var item in items)
            FilteredItems.Add(item);
    }
}
