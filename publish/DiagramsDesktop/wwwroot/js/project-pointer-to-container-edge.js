/**
 * project-pointer-to-container-edge.js
 * =====================================
 * Milestone 8 — Projects a world-space pointer position onto the nearest
 * valid container edge and derives { HostEdge, EdgeParameterT, CenterX, CenterY }.
 *
 * World space: Y increases UP.
 */

'use strict';

const ProjectPointerToContainerEdge = (() => {

  /**
   * project
   * -------
   * @param {number} px          - pointer world X
   * @param {number} py          - pointer world Y
   * @param {object} parentShape - shape with WorldX/WorldY/Width/Height
   * @returns {{ HostEdge, EdgeParameterT, CenterX, CenterY }}
   */
  function project(px, py, parentShape) {
    const b = CalculateEdgeCircleCenter.getBounds(parentShape);

    // Clamp pointer to the bounding box for distance calculation
    const cx = Math.min(Math.max(px, b.Left), b.Right);
    const cy = Math.min(Math.max(py, b.Bottom), b.Top);

    // Perpendicular distance from clamped pointer to each edge
    const dTop    = Math.abs(cy - b.Top);
    const dBottom = Math.abs(cy - b.Bottom);
    const dLeft   = Math.abs(cx - b.Left);
    const dRight  = Math.abs(cx - b.Right);

    // Find nearest edge
    const edges = [
      { edge: 'Top',    dist: dTop },
      { edge: 'Bottom', dist: dBottom },
      { edge: 'Left',   dist: dLeft },
      { edge: 'Right',  dist: dRight },
    ];
    edges.sort((a, b) => a.dist - b.dist);
    const nearest = edges[0].edge;

    const t = _computeT(px, py, b, nearest);
    const tc = Math.min(1, Math.max(0, t));
    const center = CalculateEdgeCircleCenter.fromEdgeBounds(b, nearest, tc);

    return {
      HostEdge:       nearest,
      EdgeParameterT: tc,
      CenterX:        center.CenterX,
      CenterY:        center.CenterY,
    };
  }

  /**
   * projectWithCornerTransition
   * ---------------------------
   * During an active drag, if CornerTransitionEnabled=true, allows the circle
   * to cross corners onto an adjacent edge. Uses the raw unclamped t to detect
   * corner crossing.
   *
   * @param {number} px
   * @param {number} py
   * @param {object} parentShape
   * @param {string} currentHostEdge  - active edge
   * @returns {{ HostEdge, EdgeParameterT, CenterX, CenterY }}
   */
  function projectWithCornerTransition(px, py, parentShape, currentHostEdge) {
    const b = CalculateEdgeCircleCenter.getBounds(parentShape);
    let tRaw = _computeT(px, py, b, currentHostEdge);

    if (tRaw >= 0 && tRaw <= 1) {
      // Still on the current edge
      const center = CalculateEdgeCircleCenter.fromEdgeBounds(b, currentHostEdge, tRaw);
      return { HostEdge: currentHostEdge, EdgeParameterT: tRaw, ...center };
    }

    // We crossed the corner. Use the global projection to safely find the correct edge
    // and parameter without flickering, because global project clamps to the box first
    // and correctly resolves diagonal movements.
    return project(px, py, parentShape);
  }

  // ── Private helpers ─────────────────────────────────────────────

  function _computeT(px, py, b, edge) {
    switch (edge) {
      case 'Top':
        return (b.Right - b.Left) > 0
          ? (px - b.Left) / (b.Right - b.Left) : 0;
      case 'Right':
        return (b.Top - b.Bottom) > 0
          ? (b.Top - py) / (b.Top - b.Bottom) : 0;
      case 'Bottom':
        return (b.Right - b.Left) > 0
          ? (b.Right - px) / (b.Right - b.Left) : 0;
      case 'Left':
        return (b.Top - b.Bottom) > 0
          ? (py - b.Bottom) / (b.Top - b.Bottom) : 0;
      default:
        return 0;
    }
  }

  // Clockwise edge order: Top → Right → Bottom → Left → Top
  const _edgeOrder = ['Top', 'Right', 'Bottom', 'Left'];

  function _nextEdge(edge) {
    const i = _edgeOrder.indexOf(edge);
    return _edgeOrder[(i + 1) % 4];
  }

  function _prevEdge(edge) {
    const i = _edgeOrder.indexOf(edge);
    return _edgeOrder[(i + 3) % 4];
  }

  return { project, projectWithCornerTransition };

})();
