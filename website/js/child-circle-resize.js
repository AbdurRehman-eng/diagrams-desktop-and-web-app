/**
 * child-circle-resize.js
 * ========================
 * Milestone 9 — Phase 9.5
 * Commits a validated child circle resize to CanvasState and
 * recalculates Protection Padding boundaries.
 */

'use strict';

const ChildCircleResize = (() => {

  console.log('[ChildCircleResize] MODULE LOADED - Version M9.5');

  /**
   * applyValidatedChildCircleResize
   * ---------------------------------
   * @param {string} circleShapeId   ShapeID in CanvasState
   * @param {number} ValidatedChildCircleCenterX
   * @param {number} ValidatedChildCircleCenterY
   * @param {number} ValidatedChildCircleRadius
   */
  function applyValidatedChildCircleResize(
      circleShapeId,
      ValidatedChildCircleCenterX,
      ValidatedChildCircleCenterY,
      ValidatedChildCircleRadius
  ) {
      if (!circleShapeId || isNaN(ValidatedChildCircleRadius) || ValidatedChildCircleRadius <= 0) {
          console.warn('[ChildCircleResize] Invalid validated geometry — resize aborted.');
          return false;
      }

      // Update canonical geometry
      CanvasState.updateShape(circleShapeId, {
          WorldX:  ValidatedChildCircleCenterX,
          WorldY:  ValidatedChildCircleCenterY,
          Radius:  ValidatedChildCircleRadius,
          Width:   ValidatedChildCircleRadius * 2,
          Height:  ValidatedChildCircleRadius * 2,
      });

      return true;
  }

  return { applyValidatedChildCircleResize };

})();
