/**
 * screen-toworld.js
 * =================
 * Converts physical Screen coordinates to logical World coordinates.
 * Essential for mouse interaction (drawing, dragging).
 */

'use strict';

const ScreenToWorld = (() => {

  /**
   * convert
   * ────────
   * Input:  screenX, screenY, canvasWidth, canvasHeight
   * Processing: Inverse of WorldToScreen conversion
   * Output: worldPoint { x, y }
   */
  function convert(screenX, screenY, canvasWidth, canvasHeight) {
    const canvas = CanvasState.getCanvas();
    if (!canvas) return { x: 0, y: 0 };

    const zoom = canvas.ZoomScale;
    const vCenterX = canvas.ViewportCenterX;
    const vCenterY = canvas.ViewportCenterY;

    // Screen center in pixels
    const sCenterX = canvasWidth / 2;
    const sCenterY = canvasHeight / 2;

    // Inverse conversion
    // W = (S - SC) / Zoom + VC
    
    const worldX = (screenX - sCenterX) / zoom + vCenterX;
    
    // Y-flip: W.y = -(S.y - SC.y) / Zoom + VC.y
    const worldY = -(screenY - sCenterY) / zoom + vCenterY;

    return { x: worldX, y: worldY };
  }

  return { convert };

})();
