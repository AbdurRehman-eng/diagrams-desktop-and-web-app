/**
 * multi-diagram-loader.js
 * =======================
 * Responsibility: Handle multi-diagram workflows.
 *
 * BUG-10 fix: saveActiveToDb now uses CanvasState.updateDiagramMeta() for
 * root-level diagram properties (DiagramID, DiagramVersion) instead of the
 * broken CanvasState.updateCanvas() call which targeted the wrong object level.
 *
 * BUG-15 fix: Implements Phase 2.5 (multi-JSON load) and Phase 2.6 (DB list/load)
 * — openMultipleDiagramJsonFiles, renderDiagramList, selectDiagramFromList,
 * callListDiagramsApi, and selectDatabaseDiagram.
 *
 * Contract — saveActiveToDb:
 *   Trigger:     User clicks #btn-save-db
 *   Input:       Active diagram from CanvasState
 *   Validation:  Active diagram must exist
 *   Processing:  Build DTO, call DiagramApi.saveDiagram, update diagram meta
 *   Output:      Alert on success/failure
 *   State Change: DiagramID + DiagramVersion updated via updateDiagramMeta
 *   Error:       Alert with failure message; state unchanged
 */

'use strict';

const MultiDiagramLoader = (() => {

  // ── In-memory multi-diagram collection ─────────────────────────
  let _loadedDiagrams = [];       // [{DiagramID, DiagramName, ...full data}]
  let _activeDiagramIndex = -1;

  // ── Init ───────────────────────────────────────────────────────
  function init() {
    const btnSaveDb = document.getElementById('btn-save-db');
    if (btnSaveDb) btnSaveDb.addEventListener('click', saveActiveToDb);
  }

  // ══════════════════════════════════════════════════════════════
  //  PHASE 2.4 — Save active diagram to DB
  // ══════════════════════════════════════════════════════════════

  /**
   * saveActiveToDb
   * ───────────────
   * Builds a flat DTO from both the root diagram AND Canvas sub-object,
   * then sends it to the C# API. Uses updateDiagramMeta (BUG-10 fix).
   */
  async function saveActiveToDb() {
    const diagram = CanvasState.getActiveDiagram();
    if (!diagram) { alert('No active diagram to save.'); return; }

    const payload = (typeof BuildDiagramJson !== 'undefined') ? BuildDiagramJson.buildFlatDto() : null;
    if (!payload) { alert('Could not build diagram payload.'); return; }

    const result = await DiagramApi.saveDiagram(payload);
    if (result) {
      alert(`Diagram "${diagram.DiagramName}" saved to database (v${result.DiagramVersion}).`);
      // BUG-10 fix: use updateDiagramMeta, NOT updateCanvas, for root-level fields
      CanvasState.updateDiagramMeta({
        DiagramID:      result.DiagramID,
        DiagramVersion: result.DiagramVersion
      });
    } else {
      alert('Failed to save to database. Check the browser console for details.');
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  PHASE 2.5 — Load multiple diagrams from JSON (BUG-15)
  // ══════════════════════════════════════════════════════════════

  /**
   * openMultipleDiagramJsonFiles
   * ─────────────────────────────
   * Trigger:     User opens multiple JSON files (hook into btn-open-json with multi flag,
   *              or add a dedicated "Open Multiple" button)
   * Processing:  Reads all selected files, parses each, builds selectable list
   */
  function openMultipleDiagramJsonFiles() {
    const input = document.createElement('input');
    input.type     = 'file';
    input.accept   = '.json';
    input.multiple = true;

    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;

      _loadedDiagrams = [];
      const errors = [];

      const reads = files.map(file => new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = _parseSingleJsonFile(ev.target.result, file.name);
          if (result.ok)    _loadedDiagrams.push(result.data);
          else              errors.push(`${file.name}: ${result.error}`);
          resolve();
        };
        reader.onerror = () => { errors.push(`${file.name}: read error`); resolve(); };
        reader.readAsText(file);
      }));

      await Promise.all(reads);

      if (errors.length) {
        console.warn('[MultiLoader] Some files failed:', errors);
        alert(`${errors.length} file(s) failed to load:\n` + errors.join('\n'));
      }

      if (_loadedDiagrams.length === 0) { alert('No valid diagrams loaded.'); return; }

      renderDiagramList(_loadedDiagrams, 'json');

      // Auto-select first diagram
      _activeDiagramIndex = 0;
      _applyLoadedDiagramData(_loadedDiagrams[0]);
    };

    input.click();
  }

  function _parseSingleJsonFile(jsonText, filename) {
    try {
      const data = JSON.parse(jsonText);
      const err  = ParseDiagramJson.validateDiagramJsonStructure(data);
      if (err) return { ok: false, error: err };
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }

  // ══════════════════════════════════════════════════════════════
  //  PHASE 2.6 — Load multiple diagrams from DB (BUG-15)
  // ══════════════════════════════════════════════════════════════

  /**
   * callListDiagramsApi
   * ─────────────────────
   * Trigger:     User requests diagram list from DB
   * Processing:  Calls DiagramApi.listDiagrams, renders selectable summary list
   */
  async function callListDiagramsApi() {
    const summaries = await DiagramApi.listDiagrams();
    if (!summaries || summaries.length === 0) {
      alert('No saved diagrams found in the database.');
      return;
    }
    renderDiagramList(summaries, 'db');
  }

  /**
   * selectDatabaseDiagram
   * ──────────────────────
   * Trigger:     User clicks a row in the DB diagram list
   * Input:       diagramId (string)
   * Processing:  Loads full diagram from API, applies to CanvasState
   */
  async function selectDatabaseDiagram(diagramId) {
    const data = await DiagramApi.loadDiagram(diagramId);
    if (!data) {
      alert('Failed to load diagram from database.');
      return;
    }
    _applyLoadedDiagramData(data);
  }

  /**
   * renderDiagramList
   * ──────────────────
   * Trigger:     After multi-JSON parse or DB list response
   * Input:       diagrams — array of diagram summaries or full objects
   *              source — 'json' | 'db'
   * Processing:  Creates floating list panel; each row is clickable
   */
  function renderDiagramList(diagrams, source) {
    // Remove existing panel if any
    const existing = document.getElementById('diagram-list-panel');
    if (existing) existing.remove();

    const panel = document.createElement('div');
    panel.id = 'diagram-list-panel';
    panel.className = 'diagram-list-panel';
    panel.innerHTML = `
      <div class="diagram-list-header">
        <span class="diagram-list-title">${source === 'db' ? 'Saved Diagrams' : 'Loaded Files'}</span>
        <button class="diagram-list-close" id="diagram-list-close" aria-label="Close diagram list">✕</button>
      </div>
      <div class="diagram-list-body" id="diagram-list-body"></div>`;

    const body = panel.querySelector('#diagram-list-body');

    diagrams.forEach((d, idx) => {
      const row = document.createElement('div');
      row.className = 'diagram-list-row';
      if (idx === _activeDiagramIndex) row.classList.add('active');
      row.dataset.index = idx;
      row.dataset.diagramId = d.DiagramID || '';

      const name    = d.DiagramName || 'Unnamed';
      const version = d.DiagramVersion !== undefined ? ` v${d.DiagramVersion}` : '';
      const id      = d.DiagramID ? d.DiagramID.slice(-6) : '—';

      row.innerHTML = `
        <span class="diagram-list-name">${_esc(name)}${version}</span>
        <span class="diagram-list-id">#${id}</span>`;

      row.addEventListener('click', () => {
        _activeDiagramIndex = idx;
        // Highlight active
        body.querySelectorAll('.diagram-list-row').forEach(r => r.classList.remove('active'));
        row.classList.add('active');

        if (source === 'db') {
          selectDatabaseDiagram(d.DiagramID);
        } else {
          _applyLoadedDiagramData(diagrams[idx]);
        }
      });

      body.appendChild(row);
    });

    document.getElementById('app-root').appendChild(panel);

    document.getElementById('diagram-list-close').addEventListener('click', () => {
      panel.remove();
    });
  }

  // ── Shared loader ─────────────────────────────────────────────

  /**
   * _applyLoadedDiagramData
   * ─────────────────────────
   * Applies a loaded diagram object (from JSON or DB) to CanvasState and re-renders.
   */
  function _applyLoadedDiagramData(data) {
    const ok = CanvasState.initializeCanvasState(data);
    if (!ok) { alert('Failed to apply diagram to canvas.'); return; }
    
    // Reset history tracking for the newly loaded diagram
    if (typeof HistoryManager !== 'undefined') {
        HistoryManager.clear();
        HistoryManager.recordState();
    }
    
    RenderCanvas.render();
    console.log('[MultiLoader] Applied diagram:', data.DiagramID);
  }

  // ── Legacy: single diagram load by ID ─────────────────────────
  async function loadByDiagramId(id) {
    await selectDatabaseDiagram(id);
  }

  // ── Helpers ───────────────────────────────────────────────────
  function _esc(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  return {
    init,
    saveActiveToDb,
    openMultipleDiagramJsonFiles,
    callListDiagramsApi,
    renderDiagramList,
    selectDatabaseDiagram,
    loadByDiagramId,
  };

})();
