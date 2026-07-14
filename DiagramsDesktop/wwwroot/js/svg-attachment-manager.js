/**
 * svg-attachment-manager.js
 * =========================
 * Coordinates CRUD operations for SVG assets and their attachments to host shapes.
 */

'use strict';

const SvgAttachmentManager = (() => {

  /**
   * addAsset
   * Validates and registers an SVG asset in the canvas state.
   * @param {Object} canvasState - Global canvas state.
   * @param {string} name - Human-readable name.
   * @param {string} rawSvg - SVG XML content.
   * @returns {Object} The created asset or throws an Error.
   */
  function addAsset(canvasState, name, rawSvg) {
    if (typeof SvgAssetValidation !== 'undefined') {
      const validation = SvgAssetValidation.validate(rawSvg);
      if (!validation.ok) {
        throw new Error(`SVG Validation Failed: ${validation.reason}`);
      }
    }

    if (!canvasState.SvgAssets) {
      canvasState.SvgAssets = [];
    }

    // Check if asset already exists to avoid duplicates
    let asset = canvasState.SvgAssets.find(a => a.RawSvgContent === rawSvg);
    if (!asset) {
      asset = {
        AssetID: 'asset_' + Math.random().toString(36).substr(2, 9),
        DiagramID: canvasState.DiagramID,
        AssetName: name || 'Custom SVG',
        RawSvgContent: rawSvg,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString()
      };
      canvasState.SvgAssets.push(asset);
    }
    return asset;
  }

  /**
   * attachAsset
   * Attaches an SVG asset to a shape.
   */
  function attachAsset(canvasState, assetId, hostShapeId, fittingType = 'fit-aspect', scaleX = 1.0, scaleY = 1.0, offsetX = 0, offsetY = 0, zOrder = 100) {
    if (!canvasState.SvgAttachments) {
      canvasState.SvgAttachments = [];
    }

    // Check if the host shape exists
    const hostExists = canvasState.Shapes && canvasState.Shapes.some(s => s.ShapeID === hostShapeId && !s.IsDeleted);
    if (!hostExists) {
      throw new Error(`Host shape ${hostShapeId} not found or is deleted.`);
    }

    const attachment = {
      AttachmentID: 'attach_' + Math.random().toString(36).substr(2, 9),
      DiagramID: canvasState.DiagramID,
      AssetID: assetId,
      HostShapeID: hostShapeId,
      FittingType: fittingType,
      ScaleX: scaleX,
      ScaleY: scaleY,
      OffsetX: offsetX,
      OffsetY: offsetY,
      ZOrder: zOrder,
      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString()
    };

    canvasState.SvgAttachments.push(attachment);
    return attachment;
  }

  /**
   * updateAttachment
   * Updates properties of an SVG attachment.
   */
  function updateAttachment(canvasState, attachmentId, updates) {
    if (!canvasState.SvgAttachments) return null;

    const att = canvasState.SvgAttachments.find(a => a.AttachmentID === attachmentId);
    if (!att) return null;

    Object.assign(att, updates, {
      UpdatedAt: new Date().toISOString()
    });

    return att;
  }

  /**
   * removeAttachment
   * Deletes an SVG attachment from the canvas.
   */
  function removeAttachment(canvasState, attachmentId) {
    if (!canvasState.SvgAttachments) return false;

    const initialLength = canvasState.SvgAttachments.length;
    canvasState.SvgAttachments = canvasState.SvgAttachments.filter(a => a.AttachmentID !== attachmentId);

    return canvasState.SvgAttachments.length < initialLength;
  }

  /**
   * getAttachmentsForShape
   * Fetches all attachments coupled to a specific shape.
   */
  function getAttachmentsForShape(canvasState, shapeId) {
    if (!canvasState.SvgAttachments) return [];
    return canvasState.SvgAttachments.filter(a => a.HostShapeID === shapeId);
  }

  return {
    addAsset,
    attachAsset,
    updateAttachment,
    removeAttachment,
    getAttachmentsForShape
  };

})();
