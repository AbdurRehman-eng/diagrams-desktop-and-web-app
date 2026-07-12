/**
 * render-shapes-panel.js
 * =======================
 * Responsibility: ORCHESTRATOR — the main entry point.
 * Builds the full ShapesPanel DOM structure, mounts it into
 * #shapes-panel-mount, wires all listeners, initialises state
 * and data flow. This module calls into every other module
 * but does not duplicate their logic.
 *
 * Phase Coverage: 1.1, 1.2, 1.3 (integrator)
 *
 * Contract Structure:
 *   Trigger / Input / Validation / Processing / Output /
 *   State Change / Next Possible Call / Error
 */

'use strict';

const RenderShapesPanel = (() => {

  /**
   * renderShapesPanel
   * ──────────────────
   * Trigger:     DOMContentLoaded (self-bootstrapping at end of file)
   * Input:       none
   * Validation:  #shapes-panel-mount must exist; state must init successfully
   * Processing:  1. Initialize state
   *              2. Build DOM structure
   *              3. Render category list
   *              4. Attach all listeners
   *              5. Load default category + items
   *              6. Apply initial splitter layout
   * Output:      Full ShapesPanel visible and interactive
   * State Change: IsShapesPanelVisible = true (via state init)
   * Next Call:   All sub-modules
   * Error:       Aborts if state init or mount point is unavailable
   */
  function renderShapesPanel() {
    // ── 1. Init state ──────────────────────────────────────────
    const ok = ShapesPanelState.initializeShapesPanelState();
    if (!ok) {
      console.error('[RenderPanel] State initialization failed — aborting render');
      return;
    }

    // ── 2. Build DOM ───────────────────────────────────────────
    const mount = document.getElementById('shapes-panel-mount');
    if (!mount) {
      console.error('[RenderPanel] #shapes-panel-mount not found');
      return;
    }

    mount.innerHTML = _buildPanelHTML();

    // ── 3. Render category list ────────────────────────────────
    _renderCategoryList();

    // ── 4. Attach all listeners ────────────────────────────────
    _attachAllListeners();

    // ── 5. Data flow init ──────────────────────────────────────
    _initializeDataFlow();

    // ── 6. Layout ──────────────────────────────────────────────
    ShapesPanelSplitter.updateShapesPanelLayout();

    console.log('[RenderPanel] ShapesPanel rendered and ready');
  }

  // ── DOM Builders ──────────────────────────────────────────────

  /**
   * renderShapesPanelHeader
   * ────────────────────────
   * Returns HTML string for the panel header region.
   */
  function renderShapesPanelHeader() {
    const title = ShapesPanelState.get('ShapesPanelTitleText') || 'SHAPES';
    return `
      <div id="ShapesPanelHeader">
        <span id="ShapesPanelTitle">${_esc(title)}</span>
        <button id="ShapesPanelToggleButton"
                aria-expanded="true"
                aria-label="Toggle Shapes Panel"
                title="Collapse Shapes Panel">
          <span class="toggle-icon" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 3L5 7l4 4" stroke="currentColor" stroke-width="1.6"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </button>
      </div>`;
  }

  /**
   * renderShapesSearchInput
   * ────────────────────────
   * Returns HTML string for the search wrapper region.
   */
  function renderShapesSearchInput() {
    const placeholder = ShapesPanelState.get('SearchPlaceholderText') || 'Search shapes…';
    return `
      <div class="search-wrapper">
        <span class="search-icon" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8.5 8.5L12 12" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </span>
        <input type="text"
               id="ShapesSearchInput"
               placeholder="${_esc(placeholder)}"
               autocomplete="off"
               spellcheck="false"
               aria-label="Search shapes" />
        <button id="search-clear-btn"
                class="search-clear-btn hidden"
                aria-label="Clear search"
                title="Clear search">
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
      </div>`;
  }

  /**
   * renderShapeCategoryList
   * ────────────────────────
   * Returns HTML string — the empty container; items are rendered dynamically.
   */
  function renderShapeCategoryListContainer() {
    return `<div id="ShapeCategoryList" role="listbox" aria-label="Shape categories"></div>`;
  }

  /**
   * renderShapesPanelSplitter
   * ──────────────────────────
   * Returns HTML string for the draggable splitter bar.
   */
  function renderShapesPanelSplitter() {
    return `<div id="ShapesPanelSplitter"
                 role="separator"
                 aria-orientation="horizontal"
                 aria-label="Resize category and items areas"
                 title="Drag to resize · Double-click to reset"></div>`;
  }

  /**
   * renderShapeLibraryItemsContainer
   * ─────────────────────────────────
   * Returns HTML string — the container that holds DraggableShapeLibraryItems.
   */
  function renderShapeLibraryItemsContainer() {
    return `<div id="ShapeLibraryItemsContainer" role="group" aria-label="Shape library items"></div>`;
  }

  // ── Full panel shell ──────────────────────────────────────────

  function _buildPanelHTML() {
    return `
      <div id="ShapesPanel">
        ${renderShapesPanelHeader()}
        <div class="panel-body">
          ${renderShapesSearchInput()}
          ${renderShapeCategoryListContainer()}
          ${renderShapesPanelSplitter()}
          ${renderShapeLibraryItemsContainer()}
        </div>
      </div>`;
  }

  // ── Category list rendering ───────────────────────────────────

  function _renderCategoryList() {
    const container  = document.getElementById('ShapeCategoryList');
    if (!container) return;

    const categories = ShapeCategories.loadShapeCategories();
    if (!categories.length) {
      container.innerHTML = '<div class="category-list-empty">No categories available</div>';
      return;
    }

    const label = document.createElement('div');
    label.className   = 'category-list-label';
    label.textContent = 'Categories';
    container.appendChild(label);

    categories.forEach(cat => {
      const el = _buildCategoryItemEl(cat);
      container.appendChild(el);
    });
  }

  function _buildCategoryItemEl(cat) {
    const div         = document.createElement('div');
    div.className     = 'ShapeCategoryItem' + (cat.isPlaceholder ? ' ShapeCategoryItem--placeholder' : '');
    div.dataset.categoryId = cat.id;
    div.setAttribute('role', 'option');
    div.setAttribute('aria-selected', 'false');
    div.setAttribute('tabindex', cat.isPlaceholder ? '-1' : '0');
    div.title         = cat.isPlaceholder ? (cat.placeholderMessage || 'Coming Soon') : cat.name;

    const iconWrap      = document.createElement('span');
    iconWrap.className  = 'category-icon';
    iconWrap.innerHTML  = cat.icon || '';
    iconWrap.setAttribute('aria-hidden', 'true');

    const nameSpan       = document.createElement('span');
    nameSpan.className   = 'category-name';
    nameSpan.textContent = cat.name;

    div.appendChild(iconWrap);
    div.appendChild(nameSpan);

    if (cat.isPlaceholder) {
      const badge       = document.createElement('span');
      badge.className   = 'category-soon-badge';
      badge.textContent = 'Soon';
      div.appendChild(badge);
    } else {
      const countBadge       = document.createElement('span');
      countBadge.className   = 'category-count';
      countBadge.textContent = ShapeCategories.getCategoryCount(cat.id);
      div.appendChild(countBadge);
    }

    return div;
  }

  // ── Listener wiring ───────────────────────────────────────────

  function _attachAllListeners() {
    // Toggle
    ToggleShapesPanel.attachToggleListener();

    // Search
    ShapesSearch.attachSearchListeners();

    // Splitter
    ShapesPanelSplitter.attachSplitterListeners();

    // Category click + keyboard
    _attachCategoryListeners();
  }

  function _attachCategoryListeners() {
    const container = document.getElementById('ShapeCategoryList');
    if (!container) return;

    container.addEventListener('click', (e) => {
      const item = e.target.closest('.ShapeCategoryItem');
      if (!item) return;
      SelectShapeCategory.selectShapeCategory(item.dataset.categoryId);
    });

    container.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const item = e.target.closest('.ShapeCategoryItem');
        if (!item) return;
        e.preventDefault();
        SelectShapeCategory.selectShapeCategory(item.dataset.categoryId);
      }
    });
  }

  // ── Data flow init ────────────────────────────────────────────

  function _initializeDataFlow() {
    SelectShapeCategory.setDefaultActiveShapeCategory();
  }

  // ── Helpers ───────────────────────────────────────────────────

  function _esc(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  // ── Public API ────────────────────────────────────────────────
  // NOTE: Self-bootstrapping DOMContentLoaded removed (BUG-01).
  // renderShapesPanel is now called exclusively by main_v2.js
  // after CanvasState and RenderCanvas are confirmed ready.

  return {
    init: renderShapesPanel,       // canonical entry point for main_v2.js
    renderShapesPanel,
    renderShapesPanelHeader,
    renderShapesSearchInput,
    renderShapeCategoryListContainer,
    renderShapesPanelSplitter,
    renderShapeLibraryItemsContainer,
  };

})();
