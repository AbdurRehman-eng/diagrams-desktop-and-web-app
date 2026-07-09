/**
 * child-rectangle-resize.js
 * ==========================
 * Milestone 9 — Phase 9.2
 * Commits a validated child rectangle resize to CanvasState.
 */

'use strict';

const ChildRectangleResize = (() => {

  console.log('[ChildRectangleResize] MODULE LOADED - Version M9.2');

  /**
   * applyValidatedChildRectangleResize
   * ------------------------------------
   * @param {string} shapeId
   * @param {number} ValidatedChildCenterX
   * @param {number} ValidatedChildCenterY
   * @param {number} ValidatedChildHalfWidth
   * @param {number} ValidatedChildHalfHeight
   */
  function applyValidatedChildRectangleResize(
      shapeId,
      ValidatedChildCenterX,
      ValidatedChildCenterY,
      ValidatedChildHalfWidth,
      ValidatedChildHalfHeight
  ) {
      if (!shapeId || isNaN(ValidatedChildHalfWidth) || ValidatedChildHalfWidth <= 0) {
          console.warn('[ChildRectangleResize] Invalid validated geometry — resize aborted.');
          return false;
      }

      CanvasState.updateShape(shapeId, {
          WorldX:  ValidatedChildCenterX,
          WorldY:  ValidatedChildCenterY,
          Width:   ValidatedChildHalfWidth  * 2,
          Height:  ValidatedChildHalfHeight * 2,
      });
      return true;
  }

  return { applyValidatedChildRectangleResize };

})();
