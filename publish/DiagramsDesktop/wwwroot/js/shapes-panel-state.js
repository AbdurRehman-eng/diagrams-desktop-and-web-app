/**
 * shapes-panel-state.js
 * =====================
 * Responsibility: Define and manage the single source of truth
 * for the Shapes Panel. All panel-scoped state lives here.
 * No DOM access. No rendering. Pure state store.
 *
 * Phase Coverage: 1.1, 1.2, 1.3
 *
 * Contract Structure:
 *   Trigger / Input / Validation / Processing / Output /
 *   State Change / Next Possible Call / Error
 */

'use strict';

const ShapesPanelState = (() => {

  // ── Identity ─────────────────────────────────────────────────
  const ShapesPanelID   = 'ShapesPanel';
  const ShapesPanelName = 'Shapes Panel';

  // ── Internal state object ─────────────────────────────────────
  let _state = {

    // ── Visibility & Lifecycle (Phase 1.1) ─────────────────────
    IsShapesPanelVisible:   false,
    IsShapesPanelCollapsed: false,

    // ── Header (Phase 1.1) ──────────────────────────────────────
    ShapesPanelTitleText: 'SHAPES',

    // ── Search (Phase 1.3) ──────────────────────────────────────
    SearchPlaceholderText: 'Search shapes…',
    SearchQuery:           '',
    SearchMode:            'items',   // 'items' | 'categories' | 'both'
    SearchEnabled:         true,

    // ── Category List (Phase 1.2) ───────────────────────────────
    CategoryListVisible:      true,
    ActiveShapeCategoryId:    null,
    ActiveShapeCategoryName:  '',
    CategorySelectionEnabled: true,
    CategoryAreaHeight:       220,    // px — also drives splitter position

    // ── Items Area (Phase 1.1 + 1.2) ────────────────────────────
    ItemsBoxVisible:            true,
    ItemsAreaHeight:            null, // computed from remaining space
    VisibleShapeLibraryItems:   [],   // full item list for active category
    FilteredShapeLibraryItems:  [],   // search-filtered subset

    // ── Splitter (Phase 1.3) ────────────────────────────────────
    SplitterEnabled:        true,
    SplitterPosition:       220,      // mirrors CategoryAreaHeight
    MinCategoryAreaHeight:  72,       // px — hard floor
    MinItemsAreaHeight:     80,       // px — hard floor
    IsSplitterDragging:     false,

    // ── Drag (Phase 1.3) ────────────────────────────────────────
    DragFromLibraryEnabled: true,
    IsLibraryItemDragging:  false,
    DraggedLibraryItemId:   null,
    DraggedLibraryItemType: null,
    DragPreviewVisible:     false,
  };

  // ──────────────────────────────────────────────────────────────
  /**
   * initializeShapesPanelState
   * ──────────────────────────
   * Trigger:     Application DOMContentLoaded bootstrap
   * Input:       Optional overrides object { key: value }
   * Validation:  Merges only keys that exist in _state; ignores unknowns
   * Processing:  Applies overrides, sets IsShapesPanelVisible = true
   * Output:      true on success, false on error
   * State Change: IsShapesPanelVisible becomes true
   * Next Call:   renderShapesPanel
   * Error:       Returns false; caller must abort rendering
   */
  function initializeShapesPanelState(overrides = {}) {
    try {
      Object.keys(overrides).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(_state, key)) {
          _state[key] = overrides[key];
        } else {
          console.warn('[ShapesPanelState] Ignored unknown key:', key);
        }
      });
      _state.IsShapesPanelVisible = true;
      return true;
    } catch (err) {
      console.error('[ShapesPanelState] initializeShapesPanelState failed:', err);
      return false;
    }
  }

  /**
   * getState
   * ────────
   * Trigger:     Any module needing a full state snapshot
   * Output:      Shallow copy of _state (read-only intent)
   */
  function getState() {
    return Object.assign({}, _state);
  }

  /**
   * setState
   * ────────
   * Trigger:     Any module updating multiple state keys at once
   * Input:       partialState object — only known keys applied
   * Processing:  Merges known keys into _state
   * Output:      none
   */
  function setState(partialState) {
    if (!partialState || typeof partialState !== 'object') return;
    Object.keys(partialState).forEach(key => {
      if (Object.prototype.hasOwnProperty.call(_state, key)) {
        _state[key] = partialState[key];
      }
    });
  }

  /**
   * get
   * ───
   * Trigger:     Any module reading a single state value
   * Input:       key (string)
   * Output:      Current value of _state[key], or undefined
   */
  function get(key) {
    return _state[key];
  }

  /**
   * set
   * ───
   * Trigger:     Any module updating a single state key
   * Input:       key (string), value (any)
   * Validation:  Key must exist in _state
   * Output:      true if set, false if key unknown
   */
  function set(key, value) {
    if (Object.prototype.hasOwnProperty.call(_state, key)) {
      _state[key] = value;
      return true;
    }
    console.warn('[ShapesPanelState] set: unknown key', key);
    return false;
  }

  // ── Public API ────────────────────────────────────────────────
  return {
    ShapesPanelID,
    ShapesPanelName,
    initializeShapesPanelState,
    getState,
    setState,
    get,
    set,
  };

})();
