/**
 * input-controller.js
 * ===================
 * Final Coordinator — Version M2.9
 * M2.9: Keyboard Delete now handles COC (IGW) deletion; COC move/resize overlap check added.
 */

'use strict';

const InputController = (() => {

  let container = null;
  let activeTool = 'select';

  function init() {
    container = document.getElementById('MainCanvasViewport');
    if (!container) return;

    container.addEventListener('mousedown', onMouseDown, { capture: true });
    window.addEventListener('mousemove', onMouseMove, { passive: false });
    window.addEventListener('mouseup',   onMouseUp);
    container.addEventListener('wheel',   onWheel, { passive: false });

    console.log('[InputController] Initialized — M2.9');
  }

  function setTool(toolName) {
    activeTool = toolName || 'select';
    console.log('[InputController] Active Tool switched to:', activeTool);
  }

  function getTool() {
    return activeTool;
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;

    const path = e.composedPath();
    let handleEl = null;
    let shapeEl  = null;

    let cocId = null;
    let isCocResize = false;
    let cocResizeHandleCode = null;
    let isCocElement = false;
    let connId = null;

    for (const el of path) {
      if (el.getAttribute) {
        const hCode    = el.getAttribute('data-handle');
        const oId      = el.getAttribute('data-obj-id');
        const cId      = el.getAttribute('data-coc-id') || (el.dataset ? el.dataset.cocId : null);
        const conn_id  = el.getAttribute('data-connection-id');
        const cssClass = el.getAttribute('class') || '';

        if (conn_id) {
          connId = conn_id;
        }

        if (cId) {
          cocId = cId;
          isCocElement = true;
        }

        if (cssClass.includes('coc-resize-handle')) {
          isCocElement = true;
          isCocResize = true;
          cocId = el.getAttribute('data-parent-coc-id') || (el.dataset ? el.dataset.parentCocId : null);
          cocResizeHandleCode = el.getAttribute('data-handle-code') || (el.dataset ? el.dataset.handleCode : null);
        }

        if (!handleEl && hCode && hCode !== 'move') handleEl = el;
        if (!shapeEl  && oId)                       shapeEl  = el;
      }
      if (el.id === 'MainCanvasViewport') break;
    }

    // M8: Mathematical fallback hit-test for COC
    if (!isCocElement && typeof CanvasState !== 'undefined') {
      const rect     = container.getBoundingClientRect();
      const worldPos = typeof ScreenToWorld !== 'undefined'
        ? ScreenToWorld.convert(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height)
        : null;

      if (worldPos) {
        const cocs = CanvasState.getCircleOnContainers ? CanvasState.getCircleOnContainers() : [];
        for (const coc of cocs) {
          const dx = worldPos.x - coc.CenterX;
          const dy = worldPos.y - coc.CenterY;
          const r  = coc.Radius + 10;
          if (dx * dx + dy * dy <= r * r) {
            cocId        = coc.CircleOnContainerID;
            isCocElement = true;
            shapeEl      = null;
            break;
          }
        }
      }
    }

    if (activeTool === 'connect') {
      const sourceId = (shapeEl ? shapeEl.dataset.objId : null) || cocId;
      if (sourceId) {
        setTool('select');
        const btnSelect = document.getElementById('btn-select');
        const btnConnect = document.getElementById('btn-connect');
        if (btnSelect) btnSelect.classList.add('toolbar-btn--active');
        if (btnConnect) btnConnect.classList.remove('toolbar-btn--active');

        if (typeof ConnectToMode !== 'undefined') {
          ConnectToMode.start(sourceId);
        }
      }
      return;
    }

    if (isCocElement) {
      e.stopPropagation();
      e.preventDefault();

      CanvasState.selectShape(null);
      if (typeof CanvasState.selectConnection !== 'undefined') {
        CanvasState.selectConnection(null);
      }
      if (cocId) {
        CircleOnContainerState.selectCircleOnContainer(cocId);

        // Block move/resize if COC is read-only
        if (checkShapeReadOnly(cocId, true)) {
          console.warn('[InputController] Selection allowed, but move/resize blocked on read-only COC:', cocId);
          RenderCanvas.render();
          return;
        }

        if (typeof MoveCircleOnContainer !== 'undefined') {
          if (isCocResize && cocResizeHandleCode) {
            MoveCircleOnContainer.beginResize(cocId, cocResizeHandleCode, e);
          } else {
            MoveCircleOnContainer.beginMove(cocId, e);
          }
        }
      }
      RenderCanvas.render();
      return;
    }

    if (connId) {
      e.stopPropagation();
      e.preventDefault();
      CanvasState.selectConnection(connId);
      RenderCanvas.render();
      return;
    }

    if (handleEl && shapeEl) {
      e.stopPropagation();
      e.preventDefault();

      const shapeId = shapeEl.dataset.objId;
      const handle  = handleEl.dataset.handle;

      console.log('[InputController] SELECTING HANDLE:', handle, 'on shape:', shapeId);
      CanvasState.selectShape(shapeId);

      // Block resize if shape is read-only
      if (checkShapeReadOnly(shapeId, false)) {
        console.warn('[InputController] Selection allowed, but resize blocked on read-only shape:', shapeId);
        RenderCanvas.render();
        return;
      }

      DragHandler.onMouseDown(e, shapeId, handle);
      RenderCanvas.render();
      return;
    }

    if (shapeEl) {
      e.stopPropagation();
      e.preventDefault();

      const shapeId = shapeEl.dataset.objId;
      console.log('[InputController] Shape hit:', shapeId);

      CanvasState.selectShape(shapeId);

      // Block drag-move if shape is read-only
      if (checkShapeReadOnly(shapeId, false)) {
        console.warn('[InputController] Selection allowed, but drag-move blocked on read-only shape:', shapeId);
        RenderCanvas.render();
        return;
      }

      DragHandler.onMouseDown(e, shapeId, 'move');
      RenderCanvas.render();
      return;
    }

    CanvasState.selectShape(null);
    if (typeof CanvasState.selectConnection !== 'undefined') {
      CanvasState.selectConnection(null);
    }
    PanHandler.onMouseDown(e);
    RenderCanvas.render();
  }

  function onMouseMove(e) {
    if (typeof MoveCircleOnContainer !== 'undefined' && MoveCircleOnContainer.isActive()) {
      e.preventDefault();
      return;
    }

    if (DragHandler.isActive()) {
      e.preventDefault();
      DragHandler.onMouseMove(e);
      return;
    }

    if (PanHandler.isActive()) {
      PanHandler.onMouseMove(e);
      return;
    }
  }

  function onMouseUp(e) {
    DragHandler.onMouseUp(e);
    PanHandler.onMouseUp(e);
  }

  function onWheel(e) {
    ZoomHandler.onWheel(e);
  }

  function onKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    if (e.key === 'Delete' || e.key === 'Backspace') {

      // ── Bug 4 fix: Delete selected COC (Internet Gateway) first ──────────
      const selectedCocId = typeof CircleOnContainerState !== 'undefined'
        ? CircleOnContainerState.getSelectedId()
        : null;

      if (selectedCocId) {
        if (checkShapeReadOnly(selectedCocId, true)) {
          alert('This resource is read-only under your current plan/entitlements and cannot be deleted.');
          return;
        }
        CanvasState.removeCircleOnContainer(selectedCocId);
        CircleOnContainerState.clearSelection();
        if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
        if (typeof DirtyTracker   !== 'undefined') DirtyTracker.markDirty();
        RenderCanvas.render();
        return;
      }

      // ── Delete selected connection ────────────────────────────────────────
      const selectedConnId = typeof CanvasState !== 'undefined' ? CanvasState.getSelectedConnectionId() : null;
      if (selectedConnId) {
        CanvasState.removeConnection(selectedConnId);
        if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
        if (typeof DirtyTracker   !== 'undefined') DirtyTracker.markDirty();
        RenderCanvas.render();
        return;
      }

      // ── Delete selected regular shape ─────────────────────────────────────
      const selected = CanvasState.getSelectedId();
      if (selected) {
        if (checkShapeReadOnly(selected, false)) {
          alert('This resource is read-only under your current plan/entitlements and cannot be deleted.');
          return;
        }
        // ── Unified deletion guard (children + COC devices) ──────────────────
        if (typeof DeleteGuard !== 'undefined') {
          const guard = DeleteGuard.check(selected);
          if (!guard.ok) {
            alert(guard.reason);
            return;
          }
        }
        CanvasState.removeShape(selected);
        CanvasState.selectShape(null);
        if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
        if (typeof DirtyTracker   !== 'undefined') DirtyTracker.markDirty();
        RenderCanvas.render();
      }
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) {
        if (typeof HistoryManager !== 'undefined') HistoryManager.redo();
      } else {
        if (typeof HistoryManager !== 'undefined') HistoryManager.undo();
      }
    }

    if (e.ctrlKey && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      if (typeof HistoryManager !== 'undefined') HistoryManager.redo();
    }
  }

  document.addEventListener('keydown', onKeyDown);

  function checkShapeReadOnly(shapeId, isCoc) {
    if (typeof Licensing === 'undefined') return false;
    if (isCoc) {
      const cocs = CanvasState.getCircleOnContainers ? CanvasState.getCircleOnContainers() : [];
      const coc = cocs.find(c => c.CircleOnContainerID === shapeId);
      if (coc && Licensing.isShapeReadOnly({ Type: coc.DeviceOnContainerEdgeType || 'aws-igw' })) {
        return true;
      }
    } else {
      const shapes = CanvasState.getShapes ? CanvasState.getShapes() : [];
      const shape = shapes.find(s => s.ShapeID === shapeId);
      if (shape && Licensing.isShapeReadOnly(shape)) {
        return true;
      }
    }
    return false;
  }

  return { init, setTool, getTool };

})();
