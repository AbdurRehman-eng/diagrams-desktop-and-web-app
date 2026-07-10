/**
 * move-circle-on-container.js
 * ============================
 * Milestone 8 — Controls drag movement and resize of a Circle On Container
 * along the host container edge.
 *
 * Usage:
 *   MoveCircleOnContainer.beginMove(cocId, mouseEvent)
 *   MoveCircleOnContainer.beginResize(cocId, handle, mouseEvent)
 *   // Then mousemove / mouseup are handled internally via document listeners.
 */

'use strict';

const MoveCircleOnContainer = (() => {

  console.log('[MoveCircleOnContainer] MODULE LOADED - Version M8.0');

  let _active      = false;
  let _mode        = null;   // 'move' | 'resize'
  let _cocId       = null;
  let _snapshot    = null;   // deep copy at drag start
  let _startScreen = null;   // { x, y } screen px

  // ── Public: Begin ───────────────────────────────────────────────

  function beginMove(cocId, e) {
    e.stopPropagation();
    e.preventDefault();
    _begin('move', cocId, null, e);
  }

  function beginResize(cocId, handle, e) {
    e.stopPropagation();
    e.preventDefault();
    _begin('resize', cocId, handle, e);
  }

  function isActive() { return _active; }

  // ── Private: Begin ─────────────────────────────────────────────

  function _begin(mode, cocId, handle, e) {
    const coc = CircleOnContainerState.getById(cocId);
    if (!coc) return;

    _active   = true;
    _mode     = mode;
    _cocId    = cocId;
    _snapshot = JSON.parse(JSON.stringify(coc));
    _startScreen = { x: e.clientX, y: e.clientY };

    // M8 Stability: Initialize 'PreviousValid' values if they don't exist
    // to prevent undefined rollbacks on first invalid move tick.
    if (coc.PreviousValidEdgeParameterT === undefined) {
      CanvasState.updateCircleOnContainer(cocId, {
        PreviousValidEdgeParameterT: coc.EdgeParameterT,
        PreviousValidCenterX:        coc.CenterX,
        PreviousValidCenterY:        coc.CenterY
      });
    }

    CircleOnContainerState.selectCircleOnContainer(cocId);
    CircleOnContainerState.setDragState({ cocId, mode, handle });

    document.body.style.cursor = mode === 'resize' ? 'crosshair' : 'move';

    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mouseup',   _onMouseUp);
  }

  // ── Private: Move ──────────────────────────────────────────────

  function _onMouseMove(e) {
    if (!_active) return;

    const container = document.getElementById('MainCanvasViewport');
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const worldPos = ScreenToWorld.convert(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );

    if (_mode === 'move') {
      _processMove(worldPos);
    } else if (_mode === 'resize') {
      _processResize(e, rect);
    }

    RenderCanvas.render();
  }

  function _processMove(worldPos) {
    const coc = CircleOnContainerState.getById(_cocId);
    if (!coc || !coc.MovementEnabled) return;

    const parentShape = CanvasState.getShapes().find(s => s.ShapeID === coc.ParentContainerID);
    if (!parentShape) return;

    // Project pointer to the container edge with corner-transition
    const result = coc.CornerTransitionEnabled
      ? ProjectPointerToContainerEdge.projectWithCornerTransition(
          worldPos.x, worldPos.y, parentShape, coc.HostEdge
        )
      : _clampedProject(worldPos.x, worldPos.y, parentShape, coc.HostEdge);

    const candidate = {
      CircleOnContainerID:         coc.CircleOnContainerID,
      ParentContainerID:           coc.ParentContainerID,
      HostEdge:                    result.HostEdge,
      EdgeParameterT:              result.EdgeParameterT,
      CenterX:                     result.CenterX,
      CenterY:                     result.CenterY,
      Radius:                      coc.Radius,
      ProtectionPaddingRadiusRatio: coc.ProtectionPaddingRadiusRatio,
    };

    const validation = ValidateEdgeCirclePlacement.validate(candidate, parentShape);

    if (validation.ok) {
      // Apply candidate
      CanvasState.updateCircleOnContainer(_cocId, {
        HostEdge:                   result.HostEdge,
        EdgeParameterT:             result.EdgeParameterT,
        CenterX:                    result.CenterX,
        CenterY:                    result.CenterY,
        PreviousValidEdgeParameterT: result.EdgeParameterT,
        PreviousValidCenterX:        result.CenterX,
        PreviousValidCenterY:        result.CenterY,
      });
    } else {
      // Restore previous valid position
      CanvasState.updateCircleOnContainer(_cocId, {
        HostEdge:       coc.HostEdge,
        EdgeParameterT: coc.PreviousValidEdgeParameterT,
        CenterX:        coc.PreviousValidCenterX,
        CenterY:        coc.PreviousValidCenterY,
      });
    }
  }

  function _clampedProject(px, py, parentShape, currentHostEdge) {
    // No corner transition — project but clamp to current edge only
    const b = CalculateEdgeCircleCenter.getBounds(parentShape);
    // Use the direct formula from project module but skip edge-switching
    return ProjectPointerToContainerEdge.projectWithCornerTransition(
      px, py, parentShape, currentHostEdge
    );
  }

  function _processResize(e, rect) {
    const coc = CircleOnContainerState.getById(_cocId);
    if (!coc || !coc.RadiusResizeEnabled) return;

    const parentShape = CanvasState.getShapes().find(s => s.ShapeID === coc.ParentContainerID);
    if (!parentShape) return;

    const worldStart = ScreenToWorld.convert(
      _startScreen.x - rect.left,
      _startScreen.y - rect.top,
      rect.width,
      rect.height
    );
    const worldCurrent = ScreenToWorld.convert(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );

    // Compute distance from COC center to pointer as new radius candidate
    const cocCenterScreen = WorldToScreen.convert(coc.CenterX, coc.CenterY, rect.width, rect.height);
    const dx = e.clientX - rect.left - cocCenterScreen.x;
    const dy = e.clientY - rect.top  - cocCenterScreen.y;
    const zoom = CanvasState.getCanvas()?.ZoomScale ?? 1;
    const candidateRadius = Math.sqrt(dx*dx + dy*dy) / zoom;

    const rv = ValidateEdgeCirclePlacement.validateRadiusRange(
      candidateRadius, parentShape, coc.HostEdge
    );

    // Always clamp — never block resize, just clamp to boundary
    CanvasState.updateCircleOnContainer(_cocId, { Radius: rv.clampedRadius });
  }

  // ── Private: Mouse Up ──────────────────────────────────────────

  function _onMouseUp() {
    if (!_active) return;

    document.body.style.cursor = 'default';
    CircleOnContainerState.clearDragState();

    // ── M9.5 COC Collision Check on MouseUp ──────────────────────────
    // Check if the COC now overlaps any existing shape
    const coc = CircleOnContainerState.getById(_cocId);
    if (coc) {
      let collided = false;
      const allShapes = CanvasState.getShapes();
      const cocObj = { type: 'circle', cx: coc.CenterX, cy: coc.CenterY, r: coc.Radius };

      for (const shape of allShapes) {
        // Skip the parent container it's attached to
        if (shape.ShapeID === coc.ParentContainerID) continue;

        const geom = (shape.GeometryType || shape.Type || '').toLowerCase();
        let shapeObj;
        if (geom === 'circle' || geom === 'ellipse') {
            shapeObj = { type: 'circle', cx: shape.WorldX, cy: shape.WorldY, r: shape.Radius ?? shape.Width/2 };
        } else if (geom === 'line') {
            shapeObj = { type: 'line', x1: shape.WorldX - shape.Width/2, y1: shape.WorldY - shape.Height/2, x2: shape.WorldX + shape.Width/2, y2: shape.WorldY + shape.Height/2 };
        } else {
            shapeObj = { type: 'rectangle', x: shape.WorldX - shape.Width/2, y: shape.WorldY - shape.Height/2, width: shape.Width, height: shape.Height };
        }

        if (typeof Collision !== 'undefined' && Collision.checkCollision(cocObj, shapeObj)) {
            collided = true;
            break;
        }
      }

      if (collided) {
        console.warn('[MoveCircleOnContainer] REJECTED overlap - Snapping back');
        CanvasState.updateCircleOnContainer(_cocId, {
          HostEdge:       _snapshot.HostEdge,
          EdgeParameterT: _snapshot.EdgeParameterT,
          CenterX:        _snapshot.CenterX,
          CenterY:        _snapshot.CenterY,
          Radius:         _snapshot.Radius
        });
      }
    }

    if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
    if (typeof DirtyTracker   !== 'undefined') DirtyTracker.markDirty();

    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('mouseup',   _onMouseUp);

    _active = false;
    _mode   = null;
    _cocId  = null;
    _snapshot = null;
    _startScreen = null;

    RenderCanvas.render();
  }

  return { beginMove, beginResize, isActive };

})();
