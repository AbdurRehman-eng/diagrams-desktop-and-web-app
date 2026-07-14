/**
 * diagram-api.js
 * ==============
 * Handles HTTP communication with the ASP.NET Core backend.
 * Fix 3: Added promptAndSaveToDb() that shows a name dialog before saving.
 */

'use strict';

const DiagramApi = (() => {

  const BASE_URL = '/api/DiagramCanvas';

  async function saveDiagram(dto) {
    try {
      const response = await fetch(`${BASE_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      });

      if (!response.ok) {
        // Try to extract the server's error message from JSON body
        let serverMsg = `HTTP ${response.status}`;
        try {
          const errBody = await response.json();
          serverMsg = errBody.Message || errBody.message || serverMsg;
        } catch (_) { /* non-JSON body — keep HTTP status */ }
        throw new Error(`Save failed: ${serverMsg}`);
      }
      
      const result = await response.json();
      console.log('[DiagramApi] Save successful:', result);
      return result;

    } catch (err) {
      console.error('[DiagramApi] Save error:', err);
      // Re-throw so callers (promptAndSaveToDb, saveActiveToDb) can surface it
      throw err;
    }
  }

  /**
   * promptAndSaveToDb
   * ─────────────────
   * Fix 3: Shows a dialog pre-filled with the existing diagram name.
   * User may rename it or keep the existing name, then saves to DB.
   */
  async function promptAndSaveToDb() {
    const diagram = CanvasState.getActiveDiagram();
    if (!diagram) { alert('No active diagram to save.'); return; }

    const currentName = diagram.DiagramName || 'Untitled Diagram';
    const newName = window.prompt('Save diagram to database. Enter diagram name:', currentName);
    if (newName === null) return; // user cancelled
    const finalName = newName.trim() || currentName;

    // Update name in state
    CanvasState.updateDiagramMeta({ DiagramName: finalName });

    // Validate containment and sibling overlap first
    if (typeof ContainmentSaveValidation !== 'undefined') {
      const valResult = ContainmentSaveValidation.validate();
      if (!valResult.ok) {
        alert('Save aborted. Multi-child containment validation failed:\n' + valResult.errors.join('\n'));
        return;
      }
    }

    // Build payload and save
    const payload = (typeof BuildDiagramJson !== 'undefined') 
      ? BuildDiagramJson.buildFlatDto() 
      : null;
    if (!payload) { alert('Could not build diagram payload.'); return; }

    try {
      const result = await saveDiagram(payload);
      // Sync server-assigned ID/version back into state
      if (result.DiagramID) CanvasState.updateDiagramMeta({ DiagramID: result.DiagramID });
      if (result.Version)   CanvasState.updateDiagramMeta({ DiagramVersion: result.Version });

      // Mark diagram as clean after successful save
      if (typeof DirtyTracker !== 'undefined') DirtyTracker.markClean();

      alert(`Diagram "${finalName}" saved successfully (v${result.Version ?? '?'}).`);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  }

  async function loadDiagram(id) {
    try {
      const response = await fetch(`${BASE_URL}/${id}`);
      if (!response.ok) throw new Error('Failed to load diagram from DB.');
      return await response.json();
    } catch (err) {
      console.error('[DiagramApi] Load error:', err);
      return null;
    }
  }

  async function listDiagrams() {
    try {
      const response = await fetch(`${BASE_URL}/list`);
      if (!response.ok) throw new Error('Failed to list diagrams.');
      return await response.json();
    } catch (err) {
      console.error('[DiagramApi] List error:', err);
      return [];
    }
  }

  return { saveDiagram, promptAndSaveToDb, loadDiagram, listDiagrams };

})();

