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
    private double _panelWidth = 260;
    private ObservableCollection<ShapeLibraryItem> _filteredItems = new();

    public ShapesPanelViewModel()
    {
        Categories = ShapeCategories.LoadShapeCategories();
        SelectCategoryCommand = new RelayCommand<ShapeCategory>(SelectCategory);
        ToggleCollapseCommand = new RelayCommand(ToggleCollapse);

        // Default to the first non-placeholder category if available
        SelectedCategory = Categories.FirstOrDefault(c => !c.IsPlaceholder) ?? Categories.FirstOrDefault();
    }

    public List<ShapeCategory> Categories { get; }

    public string SearchText
    {
        get => _searchText;
        set
        {
            if (SetProperty(ref _searchText, value))
            {
                RefreshFilteredItems();
            }
        }
    }

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
            }
        }
    }

    public bool IsExpanded
    {
        get => !_isCollapsed;
        set => IsCollapsed = !value;
    }

    public double PanelWidth
    {
        get => _panelWidth;
        set => SetProperty(ref _panelWidth, value);
    }

    public ObservableCollection<ShapeLibraryItem> FilteredItems
    {
        get => _filteredItems;
        set => SetProperty(ref _filteredItems, value);
    }

    public string SelectedCategoryHeader => SelectedCategory?.Name ?? "Shapes";

    public bool IsPlaceholderCategorySelected => SelectedCategory?.IsPlaceholder ?? false;

    public bool IsStandardCategorySelected => !IsPlaceholderCategorySelected;

    public string PlaceholderMessage => SelectedCategory?.PlaceholderMessage ?? "";

    public ICommand SelectCategoryCommand { get; }
    public ICommand ToggleCollapseCommand { get; }

    private void SelectCategory(ShapeCategory category)
    {
        if (category != null)
        {
            SelectedCategory = category;
        }
    }

    private void ToggleCollapse()
    {
        IsCollapsed = !IsCollapsed;
    }

    private void RefreshFilteredItems()
    {
        if (SelectedCategory == null)
        {
            FilteredItems.Clear();
            return;
        }

        var items = ShapeCategories.GetCategoryItems(SelectedCategory.Id);

        // Apply search query filter if search text is provided
        if (!string.IsNullOrWhiteSpace(SearchText))
        {
            string query = SearchText.Trim().ToLowerInvariant();
            items = items.Where(i => 
                (i.Label != null && i.Label.ToLowerInvariant().Contains(query)) ||
                (i.Type != null && i.Type.ToLowerInvariant().Contains(query))
            ).ToList();
        }

        // Update the ObservableCollection
        FilteredItems.Clear();
        foreach (var item in items)
        {
            FilteredItems.Add(item);
        }
    }
}
