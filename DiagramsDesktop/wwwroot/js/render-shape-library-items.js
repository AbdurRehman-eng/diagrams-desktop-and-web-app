/**
 * render-shape-library-items.js
 * ==============================
 * Responsibility: Render DraggableShapeLibraryItem elements inside
 * ShapeLibraryItemsContainer based on the filtered item list.
 * Calls DragShapeLibraryItem.attachDragListeners after rendering.
 *
 * Phase Coverage: 1.2, 1.3
 *
 * Contract Structure:
 *   Trigger / Input / Validation / Processing / Output /
 *   State Change / Next Possible Call / Error
 */

'use strict';

const RenderShapeLibraryItems = (() => {

  /**
   * renderShapeLibraryItems
   * ────────────────────────
   * Trigger:     loadShapeLibraryItemsByCategory, filterVisibleShapeLibraryItems
   * Input:       items — ShapeLibraryItemModel[] (may be empty)
   * Validation:  ShapeLibraryItemsContainer must exist in DOM;
   *              items must be an array
   * Processing:  Clears container; renders items-grid with one
   *              DraggableShapeLibraryItem per item; attaches drag listeners
   * Output:      DOM updated inside ShapeLibraryItemsContainer
   * State Change: none (reads state only when calling showEmptyItemsState)
   * Next Call:   DragShapeLibraryItem.attachDragListeners
   * Error:       Shows empty state if container missing or items empty
   */
  function renderShapeLibraryItems(items) {
    const container = document.getElementById('ShapeLibraryItemsContainer');
    if (!container) {
      console.error('[RenderItems] ShapeLibraryItemsContainer not found in DOM');
      return;
    }

    container.innerHTML = '';

    if (!Array.isArray(items) || items.length === 0) {
      showEmptyItemsState(container);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'items-grid';

    items.forEach(item => {
      const el = _buildItemElement(item);
      grid.appendChild(el);
    });

    container.appendChild(grid);

    // Wire drag behaviour to all rendered items
    DragShapeLibraryItem.attachDragListeners(container);
  }

  /**
   * showEmptyItemsState
   * ────────────────────
   * Trigger:     renderShapeLibraryItems (empty list), search no-results, error fallback
   * Input:       container (HTMLElement, optional) — defaults to #ShapeLibraryItemsContainer
   * Processing:  Renders an empty-state message based on current SearchQuery
   * Output:      DOM updated in container
   * State Change: none
   */
  function showEmptyItemsState(container) {
    const el = container || document.getElementById('ShapeLibraryItemsContainer');
    if (!el) return;

    const query   = ShapesPanelState.get('SearchQuery') || '';
    const message = query.trim()
      ? `No shapes match "<strong>${_escHtml(query)}</strong>"`
      : 'No shapes in this category yet.';

    el.innerHTML = `
      <div class="items-empty-state">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
          <rect x="4" y="4" width="36" height="36" rx="7"
                stroke="#2a3146" stroke-width="1.5" stroke-dasharray="6 4"/>
          <path d="M16 22h12M22 16v12"
                stroke="#2a3146" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <p>${message}</p>
      </div>`;
  }

  // ── Private builders ──────────────────────────────────────────

  /**
   * _buildItemElement
   * ──────────────────
   * Builds a single DraggableShapeLibraryItem DOM element.
   * Sets data attributes used by DragShapeLibraryItem.
   */
  function _buildItemElement(item) {
    const div         = document.createElement('div');
    div.className     = 'DraggableShapeLibraryItem';
    div.draggable     = false; // using custom mouse-based drag, not HTML5 DnD
    div.dataset.itemId    = item.id;
    div.dataset.itemType  = item.type;
    div.dataset.categoryId = item.categoryId;
    div.title         = item.label;
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', `Drag ${item.label} shape`);

    const iconEl      = document.createElement('div');
    iconEl.className  = 'shape-item-icon';
    iconEl.innerHTML  = item.svgIcon || '';
    iconEl.setAttribute('aria-hidden', 'true');

    const labelEl     = document.createElement('span');
    labelEl.className = 'shape-item-label';
    labelEl.textContent = item.label;

    div.appendChild(iconEl);
    div.appendChild(labelEl);

    return div;
  }

  function _escHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  return {
    renderShapeLibraryItems,
    showEmptyItemsState,
  };

})();
