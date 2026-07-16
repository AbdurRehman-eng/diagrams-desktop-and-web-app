/**
 * svg-scale-host-coupling.js
 * ==========================
 * Computes target width, height, and offsets for SVG attachments based on the selected fitting type.
 */

'use strict';

const SvgScaleHostCoupling = (() => {

  /**
   * computeCoupling
   * Calculates target position and dimensions to render the SVG asset.
   * @param {Object} attachment - The SVG attachment model/DTO.
   * @param {Object} contentBounds - Bounds calculated by placement engines { width, height, centerX, centerY }
   * @param {number} naturalAspectRatio - Aspect ratio of the SVG asset (width / height).
   * @returns {Object} { x: number, y: number, width: number, height: number, preserveAspectRatio: string }
   */
  function computeCoupling(attachment, contentBounds, naturalAspectRatio) {
    const fittingType = attachment.FittingType || 'fit-aspect';
    const ox = attachment.OffsetX || 0;
    const oy = attachment.OffsetY || 0;

    let targetWidth = contentBounds.width;
    let targetHeight = contentBounds.height;
    let preserveAspectRatio = 'xMidYMid meet'; // browser default for aspect fit

    if (fittingType === 'fit-aspect') {
      const hostAR = contentBounds.width / contentBounds.height;
      if (naturalAspectRatio > hostAR) {
        targetWidth = contentBounds.width;
        targetHeight = contentBounds.width / naturalAspectRatio;
      } else {
        targetHeight = contentBounds.height;
        targetWidth = contentBounds.height * naturalAspectRatio;
      }
    } else if (fittingType === 'fit-stretch') {
      targetWidth = contentBounds.width;
      targetHeight = contentBounds.height;
      preserveAspectRatio = 'none'; // stretch to fill
    } else if (fittingType === 'custom-offset') {
      const sx = typeof attachment.ScaleX === 'number' ? attachment.ScaleX : 1.0;
      const sy = typeof attachment.ScaleY === 'number' ? attachment.ScaleY : 1.0;
      targetWidth = contentBounds.width * sx;
      targetHeight = contentBounds.height * sy;
    }

    // Center the target dimensions inside the content bounds, and apply custom offset
    const x = contentBounds.centerX - (targetWidth / 2) + ox;
    const y = contentBounds.centerY - (targetHeight / 2) + oy;

    return {
      x,
      y,
      width: targetWidth,
      height: targetHeight,
      preserveAspectRatio
    };
  }

  return {
    computeCoupling
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SvgScaleHostCoupling;
}
