/**
 * shapes-panel-splitter.js
 * =========================
 * Responsibility: Handle the ShapesPanelSplitter — the draggable
 * divider between ShapeCategoryList and ShapeLibraryItemsContainer.
 * Manages mousedown/move/up lifecycle, clamping, and layout updates.
 *
 * Phase Coverage: 1.3
 *
 * Contract Structure:
 *   Trigger / Input / Validation / Processing / Output /
 *   State Change / Next Possible Call / Error
 */

'use strict';

const ShapesPanelSplitter = (() => {

  let _isDragging = false;
  let _startY     = 0;
  let _startCategoryHeight = 0;

  /**
   * beginSplitterDrag
   * ──────────────────
   * Trigger:     mousedown on #ShapesPanelSplitter
   * Input:       MouseEvent
   * Validation:  SplitterEnabled must be true
   * Processing:  Records start Y position and current CategoryAreaHeight;
   *              sets IsSplitterDragging in state;
   *              adds visual 'dragging' class;
   *              attaches document-level mousemove/mouseup listeners
   * Output:      Splitter drag session started
   * State Change: IsSplitterDragging = true
   * Next Call:   updateSplitterDrag (on mousemove)
   * Error:       No-op if SplitterEnabled is false
   */
  function beginSplitterDrag(event) {
    if (!ShapesPanelState.get('SplitterEnabled')) return;

    _isDragging          = true;
    _startY              = event.clientY;
    _startCategoryHeight = ShapesPanelState.get('CategoryAreaHeight') || 220;

    ShapesPanelState.set('IsSplitterDragging', true);

    const splitter = document.getElementById('ShapesPanelSplitter');
    if (splitter) splitter.classList.add('dragging');

    document.body.style.cursor     = 'row-resize';
    document.body.style.userSelect = 'none';

    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mouseup',   endSplitterDrag);

    event.preventDefault();
  }

  /**
   * updateSplitterDrag
   * ───────────────────
   * Trigger:     mousemove during active splitter drag
   * Input:       MouseEvent
   * Validation:  _isDragging must be true
   * Processing:  Calculates new category area height from delta Y;
   *              clamps to MinCategoryAreaHeight / MinItemsAreaHeight bounds;
   *              updates CategoryAreaHeight + SplitterPosition in state;
   *              calls updateShapesPanelLayout to apply to DOM
   * Output:      Panel layout updated — category/items regions resized
   * State Change: CategoryAreaHeight, SplitterPosition
   * Next Call:   updateShapesPanelLayout
   * Error:       clampSplitterPosition prevents out-of-bounds values
   */
  function updateSplitterDrag(event) {
    if (!_isDragging) return;

    const deltaY    = event.clientY - _startY;
    const rawHeight = _startCategoryHeight + deltaY;
    const clamped   = clampSplitterPosition(rawHeight);

    ShapesPanelState.setState({
      CategoryAreaHeight: clamped,
      SplitterPosition:   clamped,
    });

    updateShapesPanelLayout();
  }

  /**
   * endSplitterDrag
   * ────────────────
   * Trigger:     mouseup anywhere after splitter drag began
   * Input:       MouseEvent
   * Validation:  _isDragging must be true
   * Processing:  Removes listeners; resets body cursor;
   *              removes 'dragging' class from splitter;
   *              sets IsSplitterDragging = false in state
   * Output:      Splitter drag session ended
   * State Change: IsSplitterDragging = false
   * Next Call:   none — layout is already current from last updateSplitterDrag
   * Error:       Cleanup always runs — no partial state possible
   */
  function endSplitterDrag(event) {
    if (!_isDragging) return;

    _isDragging = false;
    ShapesPanelState.set('IsSplitterDragging', false);

    const splitter = document.getElementById('ShapesPanelSplitter');
    if (splitter) splitter.classList.remove('dragging');

    document.body.style.cursor     = '';
    document.body.style.userSelect = '';

    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('mouseup',   endSplitterDrag);
  }

  /**
   * clampSplitterPosition
   * ──────────────────────
   * Trigger:     updateSplitterDrag
   * Input:       rawHeight (number, px)
   * Validation:  Must respect MinCategoryAreaHeight floor and leave
   *              at least MinItemsAreaHeight for the items area
   * Processing:  Computes available panel body height; clamps within bounds
   * Output:      Clamped height value (number)
   * State Change: none — pure calculation
   * Error:       Returns rawHeight unmodified if panel-body not found
   */
  function clampSplitterPosition(rawHeight) {
    const minCat   = ShapesPanelState.get('MinCategoryAreaHeight') || 72;
    const minItems = ShapesPanelState.get('MinItemsAreaHeight')    || 80;

    // Approximate available height (panel body minus header, search, splitter)
    const panelBody  = document.querySelector('#ShapesPanel .panel-body');
    if (!panelBody) return Math.max(rawHeight, minCat);

    const bodyRect   = panelBody.getBoundingClientRect();
    const reserved   = _getReservedHeight();
    const available  = bodyRect.height - reserved;
    const maxCat     = available - minItems;

    return Math.max(minCat, Math.min(rawHeight, maxCat));
  }

  /**
   * updateShapesPanelLayout
   * ────────────────────────
   * Trigger:     updateSplitterDrag, toggleShapesPanel (on expand),
   *              initial panel render
   * Input:       none (reads CategoryAreaHeight from state)
   * Processing:  Sets inline height styles on ShapeCategoryList and
   *              ShapeLibraryItemsContainer
   * Output:      DOM style updates applied
   * State Change: none
   * Error:       No-op if target elements are missing
   */
  function updateShapesPanelLayout() {
    const categoryHeight = ShapesPanelState.get('CategoryAreaHeight') || 220;
    const catList        = document.getElementById('ShapeCategoryList');

    if (catList) {
      catList.style.height    = categoryHeight + 'px';
      catList.style.minHeight = categoryHeight + 'px';
    }
    // items container is flex: 1 — it fills remaining space automatically
  }

  /**
   * attachSplitterListeners
   * ────────────────────────
   * Trigger:     Panel mount (_attachAllListeners in render-shapes-panel.js)
   * Processing:  Wires mousedown on #ShapesPanelSplitter to beginSplitterDrag;
   *              also wires double-click to reset to default height
   */
  function attachSplitterListeners() {
    const splitter = document.getElementById('ShapesPanelSplitter');
    if (!splitter) return;

    splitter.addEventListener('mousedown', beginSplitterDrag);

    splitter.addEventListener('dblclick', () => {
      const defaultHeight = 220;
      ShapesPanelState.setState({
        CategoryAreaHeight: defaultHeight,
        SplitterPosition:   defaultHeight,
      });
      updateShapesPanelLayout();
    });
  }

  // ── Private helpers ───────────────────────────────────────────

  function _onMouseMove(event) {
    updateSplitterDrag(event);
  }

  /** Calculates the total height consumed by search wrapper + splitter */
  function _getReservedHeight() {
    let reserved = 0;
    const search   = document.querySelector('#ShapesPanel .search-wrapper');
    const splitter = document.getElementById('ShapesPanelSplitter');
    if (search)   reserved += search.getBoundingClientRect().height;
    if (splitter) reserved += splitter.getBoundingClientRect().height;
    return reserved;
  }

  return {
    beginSplitterDrag,
    updateSplitterDrag,
    endSplitterDrag,
    clampSplitterPosition,
    updateShapesPanelLayout,
    attachSplitterListeners,
  };

})();
