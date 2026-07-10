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

      if (!response.ok) throw new Error('Failed to save diagram to DB.');
      
      const result = await response.json();
      console.log('[DiagramApi] Save successful:', result);
      return result;

    } catch (err) {
      console.error('[DiagramApi] Save error:', err);
      return null;
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

    // Build payload and save
    const payload = (typeof BuildDiagramJson !== 'undefined') 
      ? BuildDiagramJson.buildFlatDto() 
      : null;
    if (!payload) { alert('Could not build diagram payload.'); return; }

    const result = await saveDiagram(payload);
    if (result) {
      // Sync server-assigned ID/version back into state
      if (result.DiagramID) CanvasState.updateDiagramMeta({ DiagramID: result.DiagramID });
      if (result.Version)   CanvasState.updateDiagramMeta({ DiagramVersion: result.Version });

      // Mark diagram as clean after successful save
      if (typeof DirtyTracker !== 'undefined') DirtyTracker.markClean();

      alert(`Diagram "${finalName}" saved successfully.`);
    } else {
      alert('Save failed. Please try again.');
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

