/**
 * select-shape-category.js
 * =========================
 * Responsibility: Handle category selection logic — update state,
 * clear previous active DOM state, set new active category,
 * trigger item loading, and apply visual highlighting.
 *
 * Phase Coverage: 1.2
 *
 * Contract Structure:
 *   Trigger / Input / Validation / Processing / Output /
 *   State Change / Next Possible Call / Error
 */

'use strict';

const SelectShapeCategory = (() => {

  /**
   * selectShapeCategory
   * ───────────────────
   * Trigger:     click on ShapeCategoryItem element
   * Input:       categoryId (string)
   * Validation:  categoryId must be a non-empty string;
   *              CategorySelectionEnabled must be true;
   *              category must exist in ShapeCategories
   * Processing:  Checks if already active (no-op if so);
   *              clears previous active state;
   *              sets new active state in DOM + state;
   *              loads and renders items for new category
   * Output:      Updated category list + items container
   * State Change: ActiveShapeCategoryId, ActiveShapeCategoryName updated
   * Next Call:   loadShapeLibraryItemsByCategory, renderShapeLibraryItems
   * Error:       Log warning; keep previous active category
   */
  function selectShapeCategory(categoryId) {
    if (!ShapesPanelState.get('CategorySelectionEnabled')) {
      console.warn('[SelectCategory] CategorySelectionEnabled is false — ignoring');
      return false;
    }
    if (!categoryId || typeof categoryId !== 'string') {
      console.warn('[SelectCategory] selectShapeCategory: invalid categoryId', categoryId);
      return false;
    }

    const category = ShapeCategories.getCategoryById(categoryId);
    if (!category) {
      console.warn('[SelectCategory] Category not found:', categoryId);
      return false;
    }

    // Duplicate selection guard
    if (ShapesPanelState.get('ActiveShapeCategoryId') === categoryId) {
      return true; // Already active — no re-render needed
    }

    clearPreviousActiveCategoryState();
    setActiveShapeCategory(category);

    const items = LoadShapeLibraryItems.loadShapeLibraryItemsByCategory(categoryId);
    RenderShapeLibraryItems.renderShapeLibraryItems(items);

    _updateStatusBar(category.name);

    return true;
  }

  /**
   * setActiveShapeCategory
   * ───────────────────────
   * Trigger:     selectShapeCategory
   * Input:       category — ShapeCategoryModel { id, name, … }
   * Processing:  Updates state and applies ActiveShapeCategoryItem class to DOM
   * Output:      State + DOM updated
   * State Change: ActiveShapeCategoryId, ActiveShapeCategoryName
   */
  function setActiveShapeCategory(category) {
    ShapesPanelState.setState({
      ActiveShapeCategoryId:   category.id,
      ActiveShapeCategoryName: category.name,
    });

    const itemEl = document.querySelector(
      `.ShapeCategoryItem[data-category-id="${CSS.escape(category.id)}"]`
    );
    if (itemEl) {
      itemEl.classList.add('ActiveShapeCategoryItem');
      itemEl.setAttribute('aria-selected', 'true');
    }
  }

  /**
   * clearPreviousActiveCategoryState
   * ─────────────────────────────────
   * Trigger:     selectShapeCategory (always called before new selection)
   * Processing:  Removes ActiveShapeCategoryItem class from all items;
   *              resets aria-selected to false
   * Output:      DOM cleaned of previous active state
   * State Change: none (state set by setActiveShapeCategory immediately after)
   */
  function clearPreviousActiveCategoryState() {
    const previousItems = document.querySelectorAll('.ShapeCategoryItem.ActiveShapeCategoryItem');
    previousItems.forEach(el => {
      el.classList.remove('ActiveShapeCategoryItem');
      el.setAttribute('aria-selected', 'false');
    });
  }

  /**
   * setDefaultActiveShapeCategory
   * ──────────────────────────────
   * Trigger:     Panel initialization (_initializeDataFlow)
   * Input:       none
   * Processing:  Loads category list; selects first category if any
   * Output:      Items box loaded with first category's items
   * State Change: ActiveShapeCategoryId, ActiveShapeCategoryName
   * Error:       Shows empty state if no categories exist
   */
  function setDefaultActiveShapeCategory() {
    const categories = ShapeCategories.loadShapeCategories();
    if (!categories || categories.length === 0) {
      RenderShapeLibraryItems.showEmptyItemsState(
        document.getElementById('ShapeLibraryItemsContainer')
      );
      return;
    }
    selectShapeCategory(categories[0].id);
  }

  /**
   * sortShapeCategories
   * ────────────────────
   * Input:  categories array
   * Output: new array sorted ascending by displayOrder
   */
  function sortShapeCategories(categories) {
    return [...categories].sort((a, b) => a.displayOrder - b.displayOrder);
  }

  // ── Private helpers ───────────────────────────────────────────

  function _updateStatusBar(categoryName) {
    const el = document.getElementById('status-active-category');
    if (el) el.textContent = 'Category: ' + categoryName;
  }

  return {
    selectShapeCategory,
    setActiveShapeCategory,
    clearPreviousActiveCategoryState,
    setDefaultActiveShapeCategory,
    sortShapeCategories,
  };

})();
