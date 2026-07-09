/**
 * derive-parent-inner-boundaries.js
 * ==================================
 * Milestone 9 — Phase 9.1
 * Derives the inner usable boundary of a parent rectangle container
 * from its canonical geometry (WorldX, WorldY, Width, Height).
 *
 * Variable names follow the Milestone 9 specification exactly:
 *   ParentInnerLeftX, ParentInnerRightX, ParentInnerTopY, ParentInnerBottomY
 *
 * Version 1 rule: inner boundary equals visible boundary.
 * The canvas Y-axis increases UPWARD (Cartesian), so:
 *   Top    = WorldY + Height/2  (largest Y)
 *   Bottom = WorldY - Height/2  (smallest Y)
 */

'use strict';

const DeriveParentInnerBoundaries = (() => {

  console.log('[DeriveParentInnerBoundaries] MODULE LOADED - Version M9.1');

  /**
   * fromShape
   * ---------
   * @param {object} parentShape  Shape from CanvasState with WorldX/Y, Width, Height
   * @returns {{ ParentInnerLeftX, ParentInnerRightX, ParentInnerTopY, ParentInnerBottomY }}
   */
  function fromShape(parentShape) {
    if (!parentShape) return null;
    const hw = (parentShape.Width  || 0) / 2;
    const hh = (parentShape.Height || 0) / 2;
    const cx = parentShape.WorldX || 0;
    const cy = parentShape.WorldY || 0;

    return {
      ParentInnerLeftX:   cx - hw,
      ParentInnerRightX:  cx + hw,
      ParentInnerTopY:    cy + hh,   // Cartesian: up = positive Y
      ParentInnerBottomY: cy - hh,
    };
  }

  /**
   * fromBounds
   * ----------
   * Direct construction from explicit coordinates.
   */
  function fromBounds(left, right, top, bottom) {
    return {
      ParentInnerLeftX:   left,
      ParentInnerRightX:  right,
      ParentInnerTopY:    top,
      ParentInnerBottomY: bottom,
    };
  }

  return { fromShape, fromBounds };

})();
