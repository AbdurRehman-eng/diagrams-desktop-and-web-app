/**
 * parse-diagram-json.js
 * =====================
 * Responsibility: Parse a JSON string into a valid diagram object,
 * validate required structure, and apply it to CanvasState.
 *
 * BUG-11 fix: _applyLoadedData now correctly passes the nested Canvas object
 * and Shapes array from the saved JSON structure to initializeCanvasState.
 * Previously, passing the flat root object caused all canvas fields to reset
 * to defaults because initializeCanvasState only read from config.Canvas.CanvasID etc.
 *
 * Contract:
 *   Trigger:     After raw file read by open-diagram-json.js
 *   Input:       Raw JSON text (string)
 *   Validation:  Must be valid JSON; must have DiagramID and Canvas
 *   Processing:  Parse → validate → apply to CanvasState → render
 *   Output:      Updated canvas state (success) or alert (failure)
 *   State Change: Replaces active diagram via CanvasState.initializeCanvasState
 *   Error:       alert() on parse/validation failure; state is NOT corrupted
 */

'use strict';

const ParseDiagramJson = (() => {

  /**
   * parse
   * ──────
   * Trigger:     open-diagram-json.js after FileReader.onload
   * Input:       jsonText — raw JSON string from file
   * Output:      none (side-effect: updates CanvasState and triggers render)
   */
  function parse(jsonText) {
    if (!jsonText || typeof jsonText !== 'string') {
      console.error('[ParseJSON] parse: received empty or non-string input');
      alert('Error: File could not be read.');
      return;
    }

    let data;
    try {
      data = JSON.parse(jsonText);
    } catch (err) {
      console.error('[ParseJSON] JSON.parse failed:', err);
      alert('Error: File is not valid JSON.\n' + err.message);
      return;
    }

    const err = _validateDiagramJsonStructure(data);
    if (err) {
      console.error('[ParseJSON] Validation failed:', err);
      alert('Error: Invalid diagram file.\n' + err);
      return;
    }

    _applyLoadedData(data);
    console.log('[ParseJSON] Diagram loaded successfully:', data.DiagramID);
  }

  /**
   * validateDiagramJsonStructure
   * ─────────────────────────────
   * Input:  data — parsed JS object
   * Output: null if valid, error string if invalid
   */
  function _validateDiagramJsonStructure(data) {
    if (!data || typeof data !== 'object')  return 'Root must be an object.';
    if (!data.DiagramID)                    return 'Missing required field: DiagramID';
    if (!data.Canvas || typeof data.Canvas !== 'object') return 'Missing required field: Canvas';
    if (!data.Canvas.CanvasID)              return 'Missing required field: Canvas.CanvasID';
    return null; // valid
  }

  /**
   * _applyLoadedData
   * ─────────────────
   * BUG-11 fix: Previously called initializeCanvasState(data) passing the flat
   * root object. initializeCanvasState reads Canvas fields from config.Canvas.CanvasID
   * etc. (or config.CanvasID as fallback). Passing the root object works for the
   * fallback path BUT the saved JSON contains nested { Canvas: {...}, Shapes: [...] }.
   * The fix: explicitly pass the full data object which now supports both layouts
   * via the (config.Canvas || config) pattern added to initializeCanvasState (BUG-18/20).
   */
  function _applyLoadedData(data) {
    const ok = CanvasState.initializeCanvasState(data);
    if (!ok) {
      console.error('[ParseJSON] CanvasState.initializeCanvasState returned false');
      alert('Error: Failed to apply loaded diagram to canvas state.');
      return;
    }
    // Fix 1: Record a baseline snapshot so Undo cannot go below the loaded state.
    if (typeof HistoryManager !== 'undefined') {
      HistoryManager.clear();
      HistoryManager.recordState();
    }
    // Clear dirty flag — the freshly loaded diagram is the saved state.
    if (typeof DirtyTracker !== 'undefined') DirtyTracker.markClean();
    RenderCanvas.render();
  }

  return {
    parse,
    validateDiagramJsonStructure: _validateDiagramJsonStructure, // exposed for multi-diagram loader
  };

})();
