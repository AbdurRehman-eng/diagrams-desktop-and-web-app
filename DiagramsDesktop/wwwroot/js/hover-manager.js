/**
 * hover-manager.js
 * ================
 * Milestone 5 — Hover detection for shapes on the canvas.
 *
 * Detects when the mouse enters the HoverPadding band around a shape
 * (based on GlobalVars.hoverPaddingRatio for the shape type).
 * Updates CanvasState.hoverShape() and triggers a lightweight re-render.
 *
 * Design rules:
 *   - Hover is World-space. Screen coordinates are converted via ScreenToWorld.
 *   - Only fires a re-render when the hovered shape actually changes.
 *   - Does NOT interfere with DragHandler or PanHandler.
 */

'use strict';

const HoverManager = (() => {

  let _container = null;

  function init() {
    _container = document.getElementById('MainCanvasViewport');
    if (!_container) return;

    _container.addEventListener('mousemove', _onMouseMove);
    _container.addEventListener('mouseleave', _onMouseLeave);
    console.log('[HoverManager] Initialized — M5 Hover Detection.');
  }

  function _onMouseMove(e) {
    // Don't override drag state
    if (typeof DragHandler !== 'undefined' && DragHandler.isActive()) return;
    if (typeof PanHandler  !== 'undefined' && PanHandler.isActive())  return;

    const rect  = _container.getBoundingClientRect();
    const worldPos = ScreenToWorld.convert(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );

    const shapes = CanvasState.getShapes();
    const cocs   = CanvasState.getCircleOnContainers ? CanvasState.getCircleOnContainers() : [];
    const gv     = CanvasState.getGlobalVars();
    let   hitShapeId = null;
    let   hitCocId   = null;

    // 1. Hit-test COCs first (they sit on top of container borders)
    for (let i = cocs.length - 1; i >= 0; i--) {
      const coc = cocs[i];
      const dx = worldPos.x - coc.CenterX;
      const dy = worldPos.y - coc.CenterY;
      // Use Radius + a small hover padding for easy targeting
      const r  = coc.Radius + 5; 
      if (dx * dx + dy * dy <= r * r) {
        hitCocId = coc.CircleOnContainerID;
        break;
      }
    }

    // 2. Hit-test regular shapes if no COC was hit
    if (!hitCocId) {
      for (let i = shapes.length - 1; i >= 0; i--) {
        const s    = shapes[i];
        const type = (s.Type || 'rectangle').toLowerCase();

        // Skip lines — hover handled differently
        if (type === 'line') continue;

        const ratio = (type === 'circle' || type === 'ellipse')
          ? gv.circle.hoverPaddingRatio
          : gv.rectangle.hoverPaddingRatio;

        const minDim = Math.min(s.Width, s.Height);
        const pad    = minDim * ratio;

        if (_hitTest(s, type, worldPos, pad)) {
          hitShapeId = s.ShapeID;
          break;
        }
      }
    }

    let needsRender = false;

    // Update regular shape hover
    const prevShape = CanvasState.getHoveredId();
    if (hitShapeId !== prevShape) {
      CanvasState.hoverShape(hitShapeId);
      needsRender = true;
    }

    // Update COC hover if the state manager exists
    if (typeof CircleOnContainerState !== 'undefined') {
      const prevCoc = CircleOnContainerState.getHoveredId();
      if (hitCocId !== prevCoc) {
        CircleOnContainerState.hoverCircleOnContainer(hitCocId);
        needsRender = true;
      }
    }

    if (needsRender && typeof RenderCanvas !== 'undefined') {
      RenderCanvas.render();
    }
  }

  function _onMouseLeave() {
    const prev = CanvasState.getHoveredId();
    if (prev !== null) {
      CanvasState.hoverShape(null);
      if (typeof RenderCanvas !== 'undefined') RenderCanvas.render();
    }
  }

  /**
   * _hitTest
   * ─────────
   * Returns true if worldPos is within the inflated bounding area of shape s.
   * pad adds an extra ring around the shape boundary.
   */
  function _hitTest(s, type, pos, pad) {
    if (type === 'circle' || type === 'ellipse') {
      const rx = s.Width  / 2 + pad;
      const ry = s.Height / 2 + pad;
      const dx = (pos.x - s.WorldX) / rx;
      const dy = (pos.y - s.WorldY) / ry;
      return dx * dx + dy * dy <= 1;
    }
    // Rectangle (axis-aligned)
    const hw = s.Width  / 2 + pad;
    const hh = s.Height / 2 + pad;
    return (
      pos.x >= s.WorldX - hw && pos.x <= s.WorldX + hw &&
      pos.y >= s.WorldY - hh && pos.y <= s.WorldY + hh
    );
  }

  return { init };

})();
