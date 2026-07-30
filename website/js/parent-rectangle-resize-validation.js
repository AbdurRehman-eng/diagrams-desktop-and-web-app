/**
 * parent-rectangle-resize-validation.js
 * ========================================
 * Milestone 9 — Phase 9.3 & 9.6
 * Validates a candidate parent rectangle resize against ALL contained children
 * (both rectangles and circles) using their current Protection Padding boundaries.
 *
 * A parent resize is valid only if ALL children remain fully within
 * the proposed new parent inner boundaries.
 */

'use strict';

const ParentRectangleResizeValidation = (() => {

  console.log('[ParentRectangleResizeValidation] MODULE LOADED - Version M9.3');

  const EPSILON = 0.5;

  function _getDescendantIds(parentId, allShapes) {
    const result = new Set();
    const queue  = [parentId];
    const visited = new Set();
    while (queue.length > 0) {
      const current  = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);

      const children = allShapes.filter(s => s.ParentContainerID === current);
      for (const child of children) {
        result.add(child.ShapeID);
        queue.push(child.ShapeID);
      }
    }
    return result;
  }

  /**
   * validate
   * --------
   * @param {{ ParentInnerLeftX, ParentInnerRightX, ParentInnerTopY, ParentInnerBottomY }} candidateBounds
   * @param {string} parentShapeId   ShapeID of the parent container
   * @param {object[]} allShapes     All shapes from CanvasState
   * @returns {{ valid: boolean, reason: string }}
   */
  function validate(candidateBounds, parentShapeId, allShapes) {
    const { ParentInnerLeftX, ParentInnerRightX, ParentInnerTopY, ParentInnerBottomY } = candidateBounds;
    const descendantIds = _getDescendantIds(parentShapeId, allShapes);
    const descendants = allShapes.filter(s => descendantIds.has(s.ShapeID));

    for (const child of descendants) {
      const result = _validateChild(child, ParentInnerLeftX, ParentInnerRightX, ParentInnerTopY, ParentInnerBottomY);
      if (!result.valid) {
        return { valid: false, reason: `Child "${child.Label || child.ShapeID}" would be outside new parent bounds: ${result.reason}` };
      }
    }
    return { valid: true, reason: 'ok' };
  }

  function _validateChild(child, left, right, top, bottom) {
    const geom = (child.GeometryType || child.Type || '').toLowerCase();
    const isCircle = geom === 'circle' || geom === 'ellipse';

    if (isCircle) {
      const r    = child.Radius ?? child.Width / 2;
      const gv   = CanvasState.getGlobalVars();
      const pp   = (gv.circle?.protectionPaddingRatio ?? 0.10) * r;
      const ppR  = r + pp;

      if (child.WorldX - ppR <= left   + EPSILON) return { valid: false, reason: 'left'   };
      if (child.WorldX + ppR >= right  - EPSILON) return { valid: false, reason: 'right'  };
      if (child.WorldY + ppR >= top    - EPSILON) return { valid: false, reason: 'top'    };
      if (child.WorldY - ppR <= bottom + EPSILON) return { valid: false, reason: 'bottom' };
    } else {
      const hw = child.Width  / 2;
      const hh = child.Height / 2;
      const gv = CanvasState.getGlobalVars();
      const px = (gv.rectangle?.protectionPaddingRatio ?? 0.10) * hw;
      const py = (gv.rectangle?.protectionPaddingRatio ?? 0.10) * hh;

      if (child.WorldX - hw - px <= left   + EPSILON) return { valid: false, reason: 'left'   };
      if (child.WorldX + hw + px >= right  - EPSILON) return { valid: false, reason: 'right'  };
      if (child.WorldY + hh + py >= top    - EPSILON) return { valid: false, reason: 'top'    };
      if (child.WorldY - hh - py <= bottom + EPSILON) return { valid: false, reason: 'bottom' };
    }
    return { valid: true, reason: 'ok' };
  }

  return { validate };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParentRectangleResizeValidation;
} else {
  window.ParentRectangleResizeValidation = ParentRectangleResizeValidation;
}

