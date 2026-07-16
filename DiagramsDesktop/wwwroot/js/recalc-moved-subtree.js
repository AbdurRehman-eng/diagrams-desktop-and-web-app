/**
 * recalc-moved-subtree.js
 * =======================
 * Performs post-movement updates (COCs recalculation, dispatch events) for all shapes in a moved subtree.
 */

'use strict';

const RecalcMovedSubtree = (() => {

  /**
   * recalculateSubtree
   * Triggers geometry updates for all shapes in the subtree.
   * @param {string} rootId - The root shape ID that was dragged.
   * @param {Array<string>} descendantIds - List of descendant shape IDs.
   */
  function recalculateSubtree(rootId, descendantIds) {
    const subtreeIds = [rootId, ...descendantIds];

    for (const shapeId of subtreeIds) {
      // 1. Recalculate attached Circle On Containers (COCs)
      if (typeof RecalculateEdgeCirclesOnParentChange !== 'undefined') {
        RecalculateEdgeCirclesOnParentChange.onParentMoved(shapeId);
      }

      // 2. Dispatch move events for circle shapes (M6/M7 compatibility)
      const shape = CanvasState.getShapes().find(s => s.ShapeID === shapeId);
      if (shape) {
        const type = (shape.Type || 'rectangle').toLowerCase();
        const isCircle = type === 'circle' || type === 'ellipse' || shape.GeometryType === 'circle';
        if (isCircle && typeof CircleEvents !== 'undefined') {
          CircleEvents.dispatchMoved(shapeId);
        }
      }
    }
  }

  return {
    recalculateSubtree
  };

})();
