/**
 * svg-follow-host.js
 * ==================
 * Automatically synchronizes DOM elements representing SVG attachments when their host shapes move/resize.
 */

'use strict';

const SvgFollowHost = (() => {

  /**
   * update
   * Updates the coordinates and dimensions of an SVG attachment DOM element.
   * @param {Object} attachment - The attachment data object.
   * @param {Object} hostShape - The host shape object.
   * @param {Object} asset - The associated SVG asset object.
   */
  function update(attachment, hostShape, asset) {
    if (!attachment || !hostShape) return;

    const elementId = `svg-attachment-${attachment.AttachmentID}`;
    const el = document.getElementById(elementId);
    if (!el) return;

    // 1. Get content bounds based on host shape type (Circle vs Rectangle)
    let contentBounds;
    const isCircle = hostShape.Type === 'Circle' || (typeof hostShape.Radius === 'number' && hostShape.Radius > 0 && !hostShape.Width);

    if (isCircle && typeof SvgPlacementCircle !== 'undefined') {
      contentBounds = SvgPlacementCircle.getContentBounds(hostShape);
    } else if (typeof SvgPlacementRectangle !== 'undefined') {
      contentBounds = SvgPlacementRectangle.getContentBounds(hostShape);
    }

    if (!contentBounds) return;

    // 2. Compute natural aspect ratio
    const svgContent = asset ? asset.RawSvgContent : '';
    const ar = typeof SvgAssetMetadata !== 'undefined'
      ? SvgAssetMetadata.getNaturalAspectRatio(svgContent)
      : 1.0;

    // 3. Compute fitting layout
    if (typeof SvgScaleHostCoupling !== 'undefined') {
      const layout = SvgScaleHostCoupling.computeCoupling(attachment, contentBounds, ar);

      // 4. Apply to DOM element
      el.setAttribute('x', layout.x);
      el.setAttribute('y', layout.y);
      el.setAttribute('width', layout.width);
      el.setAttribute('height', layout.height);

      // Update inner svg preserveAspectRatio
      const innerSvg = el.querySelector('svg');
      if (innerSvg) {
        innerSvg.setAttribute('preserveAspectRatio', layout.preserveAspectRatio);
        innerSvg.setAttribute('width', '100%');
        innerSvg.setAttribute('height', '100%');
      }
    }
  }

  return {
    update
  };

})();
