/**
 * recalculate-container-derived-geometry-on-resize.js
 * ======================================================
 * Milestone 9 — Phase 9.3
 * Recalculates derived geometry for a parent container when it is resized,
 * then revalidates all children.
 */

'use strict';

const RecalculateContainerDerivedGeometryOnResize = (() => {

  console.log('[RecalculateContainerDerivedGeometryOnResize] MODULE LOADED - Version M9.3');

  /**
   * onParentResized
   * ---------------
   * Called after a parent container shape has been resized.
   * Recalculates parent inner boundaries and revalidates all children.
   *
   * @param {string} parentShapeId
   * @returns {{ allChildrenValid: boolean, invalidChildren: string[] }}
   */
  function onParentResized(parentShapeId) {
    const allShapes    = CanvasState.getShapes();
    const parentShape  = allShapes.find(s => s.ShapeID === parentShapeId);
    if (!parentShape) return { allChildrenValid: true, invalidChildren: [] };

    const bounds = DeriveParentInnerBoundaries.fromShape(parentShape);
    const result = ParentRectangleResizeValidation.validate(bounds, parentShapeId, allShapes);

    return {
      allChildrenValid: result.valid,
      invalidChildren:  result.valid ? [] : [result.reason],
    };
  }

  return { onParentResized };

})();
