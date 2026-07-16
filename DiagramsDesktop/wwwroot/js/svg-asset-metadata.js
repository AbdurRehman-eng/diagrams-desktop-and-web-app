/**
 * svg-asset-metadata.js
 * =====================
 * Extracts structural metadata (viewBox, dimensions) from SVGs to determine aspect ratios.
 */

'use strict';

const SvgAssetMetadata = (() => {

  /**
   * getNaturalAspectRatio
   * Parses the SVG to find width, height or viewBox and computes aspect ratio.
   * @param {string} svgContent - Raw SVG content.
   * @returns {number} The aspect ratio (width / height), defaults to 1.0.
   */
  function getNaturalAspectRatio(svgContent) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgContent, 'image/svg+xml');
      const root = doc.documentElement;

      // 1. Try viewBox first
      const viewBox = root.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4) {
          const w = parts[2];
          const h = parts[3];
          if (w > 0 && h > 0) {
            return w / h;
          }
        }
      }

      // 2. Try explicit width and height attributes
      const wAttr = root.getAttribute('width');
      const hAttr = root.getAttribute('height');
      if (wAttr && hAttr) {
        const w = parseFloat(wAttr);
        const h = parseFloat(hAttr);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          return w / h;
        }
      }
    } catch (err) {
      console.warn('[SvgAssetMetadata] Error parsing aspect ratio:', err);
    }

    return 1.0; // Default fallback
  }

  return {
    getNaturalAspectRatio
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SvgAssetMetadata;
}
