/**
 * shapes-search.js
 * =================
 * Responsibility: Handle ShapesSearchInput behavior — debounce input,
 * update SearchQuery in state, filter the visible item list,
 * and trigger re-render. Also manages the clear-button visibility.
 *
 * Phase Coverage: 1.3
 *
 * Contract Structure:
 *   Trigger / Input / Validation / Processing / Output /
 *   State Change / Next Possible Call / Error
 */

'use strict';

const ShapesSearch = (() => {

  const DEBOUNCE_MS = 140;
  let _debounceTimer = null;

  /**
   * handleShapesSearchInput
   * ────────────────────────
   * Trigger:     'input' event on #ShapesSearchInput
   * Input:       event (InputEvent)
   * Validation:  SearchEnabled must be true
   * Processing:  Reads new value; updates SearchQuery in state;
   *              shows/hides clear button; debounces filter call
   * Output:      Debounced call to filterVisibleShapeLibraryItems → renderShapeLibraryItems
   * State Change: SearchQuery updated immediately
   * Next Call:   filterVisibleShapeLibraryItems → renderShapeLibraryItems
   * Error:       Falls back to rendering full unfiltered list on exception
   */
  function handleShapesSearchInput(event) {
    if (!ShapesPanelState.get('SearchEnabled')) return;

    const query = event.target.value || '';
    ShapesPanelState.set('SearchQuery', query);

    // Toggle clear button
    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) clearBtn.classList.toggle('hidden', query.trim() === '');

    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      try {
        const filtered = filterVisibleShapeLibraryItems(query);
        RenderShapeLibraryItems.renderShapeLibraryItems(filtered);
      } catch (err) {
        console.error('[Search] handleShapesSearchInput debounce error:', err);
        // Fallback: render unfiltered visible list
        const fallback = ShapesPanelState.get('VisibleShapeLibraryItems') || [];
        RenderShapeLibraryItems.renderShapeLibraryItems(fallback);
      }
    }, DEBOUNCE_MS);
  }

  /**
   * filterVisibleShapeLibraryItems
   * ────────────────────────────────
   * Trigger:     handleShapesSearchInput (debounced)
   * Input:       query (string)
   * Validation:  VisibleShapeLibraryItems must be loaded in state
   * Processing:  Filters by label and type; stores filtered list in state
   * Output:      FilteredShapeLibraryItems[] returned to caller
   * State Change: FilteredShapeLibraryItems updated
   * Next Call:   renderShapeLibraryItems
   * Error:       Returns full visible list on exception
   */
  function filterVisibleShapeLibraryItems(query) {
    const allItems = ShapesPanelState.get('VisibleShapeLibraryItems') || [];

    if (!query || !query.trim()) {
      ShapesPanelState.set('FilteredShapeLibraryItems', allItems);
      return allItems;
    }

    try {
      const q        = query.toLowerCase().trim();
      const filtered = allItems.filter(item =>
        item.label.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
      );
      ShapesPanelState.set('FilteredShapeLibraryItems', filtered);
      return filtered;
    } catch (err) {
      console.error('[Search] filterVisibleShapeLibraryItems failed:', err);
      return allItems; // Safe fallback — show previous valid item set
    }
  }

  /**
   * clearSearch
   * ────────────
   * Trigger:     click on search-clear-btn
   * Processing:  Resets input value; fires synthetic 'input' event to trigger filter
   */
  function clearSearch() {
    const input = document.getElementById('ShapesSearchInput');
    if (!input) return;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }

  /**
   * attachSearchListeners
   * ──────────────────────
   * Trigger:     Panel mount (_attachAllListeners in render-shapes-panel.js)
   * Processing:  Wires 'input' event to handleShapesSearchInput;
   *              wires 'click' on clear button to clearSearch
   */
  function attachSearchListeners() {
    const input = document.getElementById('ShapesSearchInput');
    if (input) {
      input.addEventListener('input', handleShapesSearchInput);
    }

    const clearBtn = document.getElementById('search-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearSearch);
    }
  }

  return {
    handleShapesSearchInput,
    filterVisibleShapeLibraryItems,
    clearSearch,
    attachSearchListeners,
  };

})();
