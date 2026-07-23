/**
 * main_v2.js
 * ==========
 * Version M2.1 - Orchestrator
 *
 * Startup order (all dependencies respected):
 *   1. CanvasState      — in-memory diagram model
 *   2. RenderCanvas     — SVG rendering engine
 *   3. RenderShapesPanel — Shapes Panel UI (BUG-02: was missing)
 *   4. InputController  — mouse/wheel event routing
 *   5. DropHandler      — library-item → canvas drop events
 *   6. Persistence      — JSON save/open, DB loader wiring
 *   7. Toolbar          — button event wiring
 */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {

  console.log('[Main] APPLICATION BOOTSTRAP - M1/M2 Baseline');

  // ── 0. Licensing Check ──────────────────────────────────────────
  if (typeof Licensing !== 'undefined') {
    await Licensing.init();
  }

  // ── 1. State ────────────────────────────────────────────────────
  if (typeof CanvasState === 'undefined') {
    console.error('[Main] CRITICAL: CanvasState module not found — aborting.');
    return;
  }
  CanvasState.initializeCanvasState();

  // ── 2. Canvas renderer ──────────────────────────────────────────
  if (typeof RenderCanvas === 'undefined') {
    console.error('[Main] CRITICAL: RenderCanvas module not found — aborting.');
    return;
  }
  RenderCanvas.init();

  // ── 2.5. Load Hierarchy Constraints & M7 Lookups ────────────────
  if (typeof HierarchyLoader !== 'undefined') {
    await HierarchyLoader.load();
  }
  // M8: Load device-on-container-edge rules
  if (typeof EdgeAttachmentRulesLoader !== 'undefined') {
    await EdgeAttachmentRulesLoader.load();
  }
  if (typeof ConnectionTypeLookupCsv !== 'undefined') {
    await ConnectionTypeLookupCsv.load();
  }
  if (typeof ConnectionTypeLookupDb !== 'undefined') {
    await ConnectionTypeLookupDb.load();
  }
  if (typeof GlobalConnectionDefaults !== 'undefined') {
    await GlobalConnectionDefaults.load();
  }

  // ── 3. Shapes Panel (BUG-02 fix — was never called from here) ───
  if (typeof RenderShapesPanel !== 'undefined') {
    RenderShapesPanel.init();
  } else {
    console.warn('[Main] RenderShapesPanel not found — Shapes Panel will not render.');
  }

  // ── 4. Input controller ─────────────────────────────────────────
  if (typeof InputController !== 'undefined') InputController.init();

  // ── 4.5. Hover detection (M5) ───────────────────────────────────
  if (typeof HoverManager !== 'undefined') HoverManager.init();

  // ── 5. Drop handler ─────────────────────────────────────────────
  if (typeof DropHandler !== 'undefined') DropHandler.init();

  // ── 6. Persistence ──────────────────────────────────────────────
  if (typeof SaveDiagramJson !== 'undefined')   SaveDiagramJson.init();
  if (typeof OpenDiagramJson !== 'undefined')   OpenDiagramJson.init();
  if (typeof MultiDiagramLoader !== 'undefined') MultiDiagramLoader.init();

  // ── 7. Diagnostics ──────────────────────────────────────────────
  // const debugPanel = document.getElementById('debug-panel');
  // if (debugPanel) debugPanel.classList.remove('hidden');

  // ── 8. Resize ───────────────────────────────────────────────────
  window.addEventListener('resize', () => RenderCanvas.render());

  // ── 8.5. History ────────────────────────────────────────────────
  if (typeof HistoryManager !== 'undefined') HistoryManager.init();

  // ── 8.6. M1/M2 UI Infrastructure ────────────────────────────────
  // DropdownController is M1/M2 — it drives the File menu open/close toggle.
  if (typeof DropdownController !== 'undefined') DropdownController.init();

  // Initialize theme controller
  if (typeof ThemeController !== 'undefined') ThemeController.init();

  // ── 8.7. M5+ UI Enhancements (commented out for M1/M2 baseline) ─
  if (typeof PropertiesModal       !== 'undefined') PropertiesModal.init();
  if (typeof ContextMenuController !== 'undefined') ContextMenuController.init();
  if (typeof ConnectionOptionsMenu !== 'undefined') ConnectionOptionsMenu.init();
  if (typeof DirtyTracker          !== 'undefined') DirtyTracker.init();

  // ── 9. Toolbar ──────────────────────────────────────────────────
  _setupToolbarV2();

  // ── M9: Auto-build demo diagram (commented out for M1/M2 baseline) ──────────
  if (typeof DemoDiagramBuilder !== 'undefined') { DemoDiagramBuilder.build(); }

  console.log('[Main] Application Ready - Milestones 7 & 8 Active');
});

function _setupToolbarV2() {
  // 1. Zoom Controls (Both Top and Floating)
  const btnsZoomIn  = [document.getElementById('ctrl-zoom-in'),  document.getElementById('btn-zoom-in')];
  const btnsZoomOut = [document.getElementById('ctrl-zoom-out'), document.getElementById('btn-zoom-out')];

  btnsZoomIn.forEach(btn  => { if(btn) btn.onclick = () => ZoomHandler.zoomByDelta(1); });
  btnsZoomOut.forEach(btn => { if(btn) btn.onclick = () => ZoomHandler.zoomByDelta(-1); });

  // 2. View/File Commands
  const btnFitView   = document.getElementById('ctrl-fit-view');
  const btnNew       = document.getElementById('btn-new');
  const btnListDb    = document.getElementById('btn-list-db');

  if (btnFitView) {
    btnFitView.onclick = () => {
      CanvasState.updateCanvas({ ViewportCenterX: 0, ViewportCenterY: 0, ZoomScale: 1.0 });
      RenderCanvas.render();
    };
  }

  if (btnListDb && typeof MultiDiagramLoader !== 'undefined') {
    btnListDb.onclick = () => MultiDiagramLoader.callListDiagramsApi();
  }

  if (btnNew) {
    btnNew.onclick = () => {
      if (confirm('Clear the current diagram? Unsaved changes will be lost.')) {
        CanvasState.clearShapes();
        CanvasState.updateCanvas({ ViewportCenterX: 0, ViewportCenterY: 0, ZoomScale: 1.0 });
        if (typeof HistoryManager !== 'undefined') HistoryManager.recordState(); // M3+
        RenderCanvas.render();
      }
    };
  }

  // 3. Tool Selection
  const btnSelect = document.getElementById('btn-select');
  const btnConnect = document.getElementById('btn-connect');

  if (btnSelect) {
    btnSelect.onclick = () => {
      InputController.setTool('select');
      btnSelect.classList.add('toolbar-btn--active');
      if (btnConnect) btnConnect.classList.remove('toolbar-btn--active');
    };
  }
  if (btnConnect) {
    btnConnect.onclick = () => {
      InputController.setTool('connect');
      btnConnect.classList.add('toolbar-btn--active');
      if (btnSelect) btnSelect.classList.remove('toolbar-btn--active');
    };
  }

  // 4. Undo/Redo (M3+)
  const btnUndo = document.getElementById('btn-undo');
  const btnRedo = document.getElementById('btn-redo');
  if (btnUndo) btnUndo.onclick = () => { if (typeof HistoryManager !== 'undefined') HistoryManager.undo(); };
  if (btnRedo) btnRedo.onclick = () => { if (typeof HistoryManager !== 'undefined') HistoryManager.redo(); };

  // 5. Save to DB — prompt for name before saving
  const btnSaveDb = document.getElementById('btn-save-db');
  if (btnSaveDb && typeof DiagramApi !== 'undefined') {
    btnSaveDb.onclick = () => DiagramApi.promptAndSaveToDb();
  }

  // Theme Toggle Button
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  if (btnThemeToggle && typeof ThemeController !== 'undefined') {
    btnThemeToggle.onclick = () => ThemeController.toggle();
  }

  // Licensing Actions (Updates & Deactivation)
  const btnCheckUpdate = document.getElementById('btn-check-update');
  if (btnCheckUpdate && typeof Licensing !== 'undefined') {
    btnCheckUpdate.onclick = () => Licensing.checkAppUpdate();
  }

  const btnDeactivateLicense = document.getElementById('btn-deactivate-license');
  if (btnDeactivateLicense && typeof Licensing !== 'undefined') {
    btnDeactivateLicense.onclick = () => Licensing.deactivateDevice();
  }

  // 6. Properties Modal (M5+)
  const btnGlobalVars = document.getElementById('btn-global-vars');
  if (btnGlobalVars && typeof PropertiesModal !== 'undefined') {
    btnGlobalVars.onclick = () => PropertiesModal.openForCanvas();
  }
}
