/**
 * svg-placement-rectangle.js
 * ==========================
 * Computes fitting boundaries for custom SVG assets placed on rectangle shapes and containers.
 */

'use strict';

const SvgPlacementRectangle = (() => {

  /**
   * getContentBounds
   * Calculates the target bounding box on a rectangle host.
   * @param {Object} hostShape - The host shape object.
   * @returns {Object} { width: number, height: number, centerX: number, centerY: number }
   */
  function getContentBounds(hostShape) {
    // If the host is a container shape, respect its inner boundary constraints
    const type = (hostShape.Type || '').toLowerCase();
    const isContainer = type.includes('vpc') || type.includes('subnet') || type.includes('region') || type.includes('container');

    if (isContainer && typeof DeriveParentInnerBoundaries !== 'undefined') {
      const inner = DeriveParentInnerBoundaries.fromShape(hostShape);
      if (inner) {
        return {
          width: inner.ParentInnerRightX - inner.ParentInnerLeftX,
          height: inner.ParentInnerTopY - inner.ParentInnerBottomY,
          centerX: (inner.ParentInnerLeftX + inner.ParentInnerRightX) / 2,
          centerY: (inner.ParentInnerBottomY + inner.ParentInnerTopY) / 2
        };
      }
    }

    return {
      width: hostShape.Width,
      height: hostShape.Height,
      centerX: hostShape.WorldX,
      centerY: hostShape.WorldY
    };
  }

  return {
    getContentBounds
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SvgPlacementRectangle;
}
