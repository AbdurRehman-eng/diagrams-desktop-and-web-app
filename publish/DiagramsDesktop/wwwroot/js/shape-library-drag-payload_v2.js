/**
 * shape-library-drag-payload_v2.js
 * ===============================
 * Version M2.1
 */

'use strict';

const ShapeLibraryDragPayload = (() => {

  console.log('[DragPayload] MODULE LOADED - Version M2.1');

  function buildLibraryItemDragPayload(item) {
    if (!item || typeof item !== 'object') return null;
    return {
      sourceType:    'ShapeLibrary',
      itemId:        item.id,
      itemType:      item.type,
      itemLabel:     item.label || '',
      categoryId:    item.categoryId || '',
      originLibrary: 'ShapesPanel',
      svgIcon:       item.svgIcon || '',
      timestamp:     Date.now(),
    };
  }

  function handoffDragToCanvas(payload, dropX, dropY) {
    if (!payload) return false;

    console.log('[DragPayload] Handoff procedure started for:', payload.itemLabel);

    const detail = { payload, dropX, dropY };
    const event = new CustomEvent('libraryItemDroppedOnCanvas', {
      bubbles:    true,
      cancelable: false,
      detail: detail,
    });

    // Dispatch ONLY to window to prevent bubbling duplication (Triple Drop Fix)
    window.dispatchEvent(event);
    
    console.log('[DragPayload] Event "libraryItemDroppedOnCanvas" dispatched to window.');
    return true;
  }

  return {
    buildLibraryItemDragPayload,
    handoffDragToCanvas,
  };

})();
