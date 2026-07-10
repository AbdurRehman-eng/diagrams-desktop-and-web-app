/**
 * world-toscreen.js
 * =================
 * Converts logical World coordinates to physical Screen coordinates.
 */

'use strict';

const WorldToScreen = (() => {

  /**
   * convert
   * ────────
   * Input:  worldPoint { x, y }, viewport { centerX, centerY, zoom }, screenRect { width, height }
   * Processing: Apply scale and translation including Y-flip
   * Output: screenPoint { x, y }
   */
  function convert(worldX, worldY, canvasWidth, canvasHeight) {
    const canvas = CanvasState.getCanvas();
    if (!canvas) return { x: 0, y: 0 };

    const zoom = canvas.ZoomScale;
    const vCenterX = canvas.ViewportCenterX;
    const vCenterY = canvas.ViewportCenterY;

    // Screen center in pixels
    const sCenterX = canvasWidth / 2;
    const sCenterY = canvasHeight / 2;

    // World-to-Screen conversion
    // 1. Center relative to viewport: (W - VC)
    // 2. Scale by zoom: (W - VC) * Zoom
    // 3. Shift to screen center: (W - VC) * Zoom + SC
    
    const screenX = sCenterX + (worldX - vCenterX) * zoom;
    
    // Y-flip: Screen Y increases DOWN, World Y increases UP
    const screenY = sCenterY - (worldY - vCenterY) * zoom;

    return { x: screenX, y: screenY };
  }

  return { convert };

})();
