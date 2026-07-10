/**
 * load-shape-library-items.js
 * ============================
 * Responsibility: Load the correct item set for the currently
 * active category, apply any active search filter, and update
 * ShapesPanelState. Bridges ShapeCategories data → state.
 * No DOM access.
 *
 * Phase Coverage: 1.2
 *
 * Contract Structure:
 *   Trigger / Input / Validation / Processing / Output /
 *   State Change / Next Possible Call / Error
 */

'use strict';

const LoadShapeLibraryItems = (() => {

  /**
   * loadShapeLibraryItemsByCategory
   * ────────────────────────────────
   * Trigger:     selectShapeCategory, setDefaultActiveShapeCategory
   * Input:       categoryId (string)
   * Validation:  categoryId must be a non-empty string
   * Processing:  Fetches items via ShapeCategories.getCategoryItems,
   *              applies current SearchQuery filter if present,
   *              stores both full and filtered sets in state
   * Output:      FilteredShapeLibraryItems[] — items to render immediately
   * State Change: Updates VisibleShapeLibraryItems + FilteredShapeLibraryItems
   * Next Call:   renderShapeLibraryItems
   * Error:       Resets item arrays to [] in state; returns []
   */
  function loadShapeLibraryItemsByCategory(categoryId) {
    if (!categoryId || typeof categoryId !== 'string') {
      console.warn('[LoadItems] loadShapeLibraryItemsByCategory: invalid categoryId');
      _resetItemState();
      return [];
    }

    try {
      const allItems = ShapeCategories.getCategoryItems(categoryId);
      const query    = ShapesPanelState.get('SearchQuery') || '';
      const filtered = query.trim() ? _applySearchFilter(allItems, query) : allItems;

      ShapesPanelState.setState({
        VisibleShapeLibraryItems:  allItems,
        FilteredShapeLibraryItems: filtered,
      });

      return filtered;
    } catch (err) {
      console.error('[LoadItems] loadShapeLibraryItemsByCategory failed:', err);
      _resetItemState();
      return [];
    }
  }

  /**
   * refreshItemsBox
   * ───────────────
   * Trigger:     filterVisibleShapeLibraryItems (after search query change)
   * Input:       none (reads current state)
   * Processing:  Re-applies active search filter to VisibleShapeLibraryItems
   * Output:      Updated FilteredShapeLibraryItems[] in state
   * State Change: Updates FilteredShapeLibraryItems
   * Next Call:   renderShapeLibraryItems
   */
  function refreshItemsBox() {
    const allItems = ShapesPanelState.get('VisibleShapeLibraryItems') || [];
    const query    = ShapesPanelState.get('SearchQuery') || '';
    const filtered = query.trim() ? _applySearchFilter(allItems, query) : allItems;
    ShapesPanelState.set('FilteredShapeLibraryItems', filtered);
    return filtered;
  }

  // ── Helpers ──────────────────────────────────────────────────

  function _applySearchFilter(items, query) {
    const q = query.toLowerCase().trim();
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  }

  function _resetItemState() {
    ShapesPanelState.setState({
      VisibleShapeLibraryItems:  [],
      FilteredShapeLibraryItems: [],
    });
  }

  return {
    loadShapeLibraryItemsByCategory,
    refreshItemsBox,
  };

})();
