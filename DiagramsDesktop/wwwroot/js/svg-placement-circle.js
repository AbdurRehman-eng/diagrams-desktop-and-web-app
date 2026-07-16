/**
 * svg-placement-circle.js
 * =======================
 * Computes the largest inscribed square bounds inside circle host shapes for SVG alignment.
 */

'use strict';

const SvgPlacementCircle = (() => {

  /**
   * getContentBounds
   * Computes the inscribed square boundaries inside a circle host.
   * @param {Object} hostShape - The circle shape object.
   * @returns {Object} { width: number, height: number, centerX: number, centerY: number }
   */
  function getContentBounds(hostShape) {
    const r = hostShape.Radius ?? (hostShape.Width / 2);

    // Inscribed square side length = R * sqrt(2)
    const side = r * Math.sqrt(2);

    return {
      width: side,
      height: side,
      centerX: hostShape.WorldX,
      centerY: hostShape.WorldY
    };
  }

  return {
    getContentBounds
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SvgPlacementCircle;
}
