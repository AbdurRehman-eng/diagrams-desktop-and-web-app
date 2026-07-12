/**
 * calculate-edge-circle-center.js
 * ================================
 * Milestone 8 — Pure math: derives CenterX/CenterY from parent container
 * edge equations.
 *
 * World space: Y increases UP. ParentTopY > ParentBottomY.
 */

'use strict';

const CalculateEdgeCircleCenter = (() => {

  /**
   * fromEdge
   * --------
   * Given a parent rectangle shape and edge descriptor, returns { CenterX, CenterY }.
   *
   * @param {object} parentShape - shape with { WorldX, WorldY, Width, Height }
   * @param {string} hostEdge    - 'Top' | 'Right' | 'Bottom' | 'Left'
   * @param {number} t           - EdgeParameterT, 0..1
   */
  function fromEdge(parentShape, hostEdge, t) {
    const bounds = _getBounds(parentShape);
    return _applyEdgeEquation(bounds, hostEdge, t);
  }

  /**
   * fromEdgeBounds
   * --------
   * Same but accepts pre-computed bounds.
   */
  function fromEdgeBounds(bounds, hostEdge, t) {
    return _applyEdgeEquation(bounds, hostEdge, t);
  }

  /**
   * getEdgeLength
   * --------
   * Returns the length of the specified edge in world-space units.
   * Top/Bottom → container width; Right/Left → container height.
   */
  function getEdgeLength(parentShape, hostEdge) {
    if (hostEdge === 'Top' || hostEdge === 'Bottom') return parentShape.Width;
    return parentShape.Height;
  }

  /**
   * getBounds
   * --------
   * Returns { Left, Right, Top, Bottom } in world space.
   * Top > Bottom because world Y increases upward.
   */
  function getBounds(parentShape) {
    return _getBounds(parentShape);
  }

  // ── Private ────────────────────────────────────────────────────

  function _getBounds(shape) {
    const hw = shape.Width  / 2;
    const hh = shape.Height / 2;
    return {
      Left:   shape.WorldX - hw,
      Right:  shape.WorldX + hw,
      Top:    shape.WorldY + hh,   // world Y increases up → top has larger Y
      Bottom: shape.WorldY - hh,
    };
  }

  function _applyEdgeEquation(b, hostEdge, t) {
    const tc = Math.min(1, Math.max(0, t));
    switch (hostEdge) {
      case 'Top':
        return {
          CenterX: b.Left + tc * (b.Right - b.Left),
          CenterY: b.Top,
        };
      case 'Right':
        return {
          CenterX: b.Right,
          CenterY: b.Top - tc * (b.Top - b.Bottom),
        };
      case 'Bottom':
        return {
          CenterX: b.Right - tc * (b.Right - b.Left),
          CenterY: b.Bottom,
        };
      case 'Left':
        return {
          CenterX: b.Left,
          CenterY: b.Bottom + tc * (b.Top - b.Bottom),
        };
      default:
        console.warn('[CalculateEdgeCircleCenter] Unknown HostEdge:', hostEdge);
        return { CenterX: b.Left, CenterY: b.Top };
    }
  }

  return { fromEdge, fromEdgeBounds, getEdgeLength, getBounds };

})();
