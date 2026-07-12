/**
 * save-diagram-json.js
 * =====================
 * Fix 2: Export JSON uses showSaveFilePicker when available, with a fallback
 *        for browsers that don't support the File System Access API.
 */

'use strict';

const SaveDiagramJson = (() => {

  async function save() {
    const payload = BuildDiagramJson.build();
    if (!payload) return;

    const jsonText = JSON.stringify(payload, null, 2);
    const suggestedName = `${payload.DiagramName.replace(/\s+/g, '_')}_${payload.DiagramID.slice(-4)}.json`;

    // Try the modern File System Access API first (Chrome/Edge)
    if (window.showSaveFilePicker) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName,
          types: [{ description: 'JSON Diagram', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await fileHandle.createWritable();
        await writable.write(jsonText);
        await writable.close();
        console.log('[SaveJSON] Diagram exported via File System Access API.');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return; // user cancelled
        console.warn('[SaveJSON] showSaveFilePicker failed, falling back:', err);
      }
    }

    // Fallback: prompt for filename then trigger download
    const name = window.prompt('Enter file name for export:', suggestedName);
    if (!name) return; // user cancelled

    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name.endsWith('.json') ? name : name + '.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 0);
    console.log('[SaveJSON] Diagram exported via fallback download.');
  }

  function init() {
    const btn = document.getElementById('btn-save-json');
    if (btn) btn.addEventListener('click', save);
  }

  return { init, save };

})();

