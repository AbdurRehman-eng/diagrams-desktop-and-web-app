/**
 * context-menu.js
 * ===============
 * Handles right-click interactions on the canvas.
 */

'use strict';

const ContextMenuController = (() => {

  function init() {
    const container = document.getElementById('MainCanvasViewport');
    if (!container) return;

    const menuHtml = `
      <div id="app-context-menu" class="hidden">
        <div class="context-menu-item" id="ctx-edit-props">
          <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span id="ctx-edit-props-label">Edit Properties</span>
        </div>
        <div class="context-menu-item" id="ctx-connect-to" style="display:none;">
          <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Connect To...</span>
        </div>
        <div class="context-menu-item context-menu-item--danger" id="ctx-delete-shape" style="display:none;">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Delete Shape</span>
        </div>
        <div class="context-menu-item context-menu-item--danger" id="ctx-delete-connection" style="display:none;">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>Delete Connection</span>
        </div>
        <div class="context-menu-item context-menu-item--danger" id="ctx-delete-coc" style="display:none;">
          <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <span>Delete Edge Circle</span>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', menuHtml);

    const ctxMenu      = document.getElementById('app-context-menu');
    const btnEditProps = document.getElementById('ctx-edit-props');
    const btnConnect   = document.getElementById('ctx-connect-to');
    const btnDelete    = document.getElementById('ctx-delete-shape');
    const btnDeleteConn = document.getElementById('ctx-delete-connection');
    const btnDeleteCoc  = document.getElementById('ctx-delete-coc');
    const labelProps    = document.getElementById('ctx-edit-props-label');

    let _lastTargetShapeId = null;
    let _lastTargetConnId  = null;
    let _lastTargetCocId   = null;

    container.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const path = e.composedPath();
      let shapeEl = null;
      let connEl  = null;
      let cocEl   = null;

      for (const el of path) {
        if (el.getAttribute) {
          if (el.getAttribute('data-obj-id')) { shapeEl = el; break; }
          if (el.getAttribute('data-connection-id')) { connEl = el; break; }
          if (el.getAttribute('data-coc-id'))        { cocEl  = el; break; }
        }
        if (el.id === 'MainCanvasViewport') break;
      }

      if (shapeEl) {
        _lastTargetShapeId = shapeEl.getAttribute('data-obj-id');
        _lastTargetConnId = null;
        _lastTargetCocId  = null;
        CanvasState.selectShape(_lastTargetShapeId);
        RenderCanvas.render();
        labelProps.textContent = 'Edit Shape Properties';
        btnEditProps.style.display  = 'flex';
        btnConnect.style.display    = 'flex';
        btnDelete.style.display     = 'flex';
        btnDeleteConn.style.display = 'none';
        btnDeleteCoc.style.display  = 'none';
      } else if (connEl) {
        _lastTargetConnId  = connEl.getAttribute('data-connection-id');
        _lastTargetShapeId = null;
        _lastTargetCocId   = null;
        CanvasState.selectConnection(_lastTargetConnId);
        RenderCanvas.render();
        btnEditProps.style.display  = 'none';
        btnConnect.style.display    = 'none';
        btnDelete.style.display     = 'none';
        btnDeleteConn.style.display = 'flex';
        btnDeleteCoc.style.display  = 'none';
      } else if (cocEl) {
        _lastTargetCocId   = cocEl.getAttribute('data-coc-id');
        _lastTargetShapeId = null;
        _lastTargetConnId  = null;
        if (typeof CircleOnContainerState !== 'undefined')
          CircleOnContainerState.selectCircleOnContainer(_lastTargetCocId);
        RenderCanvas.render();
        labelProps.textContent = 'Edit Edge Device Properties';
        btnEditProps.style.display  = 'flex';
        btnConnect.style.display    = 'flex';   // ← Allow connecting FROM a COC (e.g. IGW → Route Table)
        btnDelete.style.display     = 'none';
        btnDeleteConn.style.display = 'none';
        btnDeleteCoc.style.display  = 'flex';
      } else {
        _lastTargetShapeId = null;
        _lastTargetConnId  = null;
        _lastTargetCocId   = null;
        CanvasState.selectShape(null);
        CanvasState.selectConnection(null);
        if (typeof CircleOnContainerState !== 'undefined') CircleOnContainerState.clearSelection();
        RenderCanvas.render();
        labelProps.textContent = 'Edit Canvas Properties';
        btnEditProps.style.display  = 'flex';
        btnConnect.style.display    = 'none';
        btnDelete.style.display     = 'none';
        btnDeleteConn.style.display = 'none';
        btnDeleteCoc.style.display  = 'none';
      }

      ctxMenu.style.left = `${e.pageX}px`;
      ctxMenu.style.top  = `${e.pageY}px`;
      ctxMenu.classList.remove('hidden');
    });

    document.addEventListener('pointerdown', (e) => {
      if (!ctxMenu.contains(e.target)) ctxMenu.classList.add('hidden');
    });

    btnEditProps.addEventListener('click', (e) => {
      e.stopPropagation();
      ctxMenu.classList.add('hidden');
      if (typeof PropertiesModal !== 'undefined') {
        if (_lastTargetShapeId) PropertiesModal.openForShape(_lastTargetShapeId);
        else                    PropertiesModal.openForCanvas();
      }
    });

    btnConnect.addEventListener('click', (e) => {
      e.stopPropagation();
      ctxMenu.classList.add('hidden');
      // Start connection from a regular shape OR a COC (e.g. Internet Gateway)
      const sourceId = _lastTargetShapeId || _lastTargetCocId;
      if (sourceId && typeof ConnectToMode !== 'undefined') ConnectToMode.start(sourceId);
    });

    btnDelete.addEventListener('click', (e) => {
      e.stopPropagation();
      ctxMenu.classList.add('hidden');
      if (_lastTargetShapeId) {
        // ── Unified deletion guard (children + COC devices) ──────────────────
        if (typeof DeleteGuard !== 'undefined') {
          const guard = DeleteGuard.check(_lastTargetShapeId);
          if (!guard.ok) {
            alert(guard.reason);
            return;
          }
        }
        CanvasState.removeShape(_lastTargetShapeId);
        CanvasState.selectShape(null);
        if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
        if (typeof DirtyTracker   !== 'undefined') DirtyTracker.markDirty();
        RenderCanvas.render();
      }
    });

    btnDeleteConn.addEventListener('click', (e) => {
      e.stopPropagation();
      ctxMenu.classList.add('hidden');
      if (_lastTargetConnId) {
        CanvasState.removeConnection(_lastTargetConnId);
        RenderCanvas.render();
      }
    });

    btnDeleteCoc.addEventListener('click', (e) => {
      e.stopPropagation();
      ctxMenu.classList.add('hidden');
      if (_lastTargetCocId && typeof CircleOnContainerState !== 'undefined') {
        CircleOnContainerState.remove(_lastTargetCocId);
        RenderCanvas.render();
      }
    });
  }

  return { init };
})();
