/**
 * svg-attachment-recalculation.js
 * ================================
 * Iterates through all SVG attachments on the canvas and triggers follow-host coordinate re-alignments.
 */

'use strict';

const SvgAttachmentRecalculation = (() => {

  /**
   * recalculateAll
   * Recalculates coordinates for all active, non-deleted SVG attachments.
   * @param {Object} canvasState - The global canvas state instance.
   */
  function recalculateAll(canvasState) {
    if (!canvasState) return;

    const attachments = canvasState.SvgAttachments || [];
    const shapes = canvasState.Shapes || [];
    const assets = canvasState.SvgAssets || [];

    attachments.forEach(att => {
      // Find host shape
      const hostShape = shapes.find(s => s.ShapeID === att.HostShapeID && !s.IsDeleted);
      if (!hostShape) return;

      // Find SVG asset
      const asset = assets.find(a => a.AssetID === att.AssetID);

      // Trigger positioning update
      if (typeof SvgFollowHost !== 'undefined') {
        SvgFollowHost.update(att, hostShape, asset);
      }
    });
  }

  return {
    recalculateAll
  };

})();
