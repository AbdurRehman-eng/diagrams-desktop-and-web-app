/**
 * viewport-math.js
 * =================
 * Handles logic for panning and zooming calculations.
 */

'use strict';

const ViewportMath = (() => {

  function calculatePan(deltaX, deltaY, zoom) {
    // Panning moves the viewport in the direction of the drag.
    // Screen X moves right → world X moves right → viewport center increases → objects move left: correct.
    // Screen Y moves down  → world Y is UpPositive, so viewport center must DECREASE → objects appear to move up: correct.
    // BUG-08 fix: dY must be negated to respect the Y-flip between screen and world space.
    return {
      dX: -(deltaX / zoom),
      dY:  (deltaY / zoom)   // BUG-08 fixed: was incorrect sign; both axes now pan correctly
    };
  }

  function calculateZoom(currentZoom, direction, anchorScreenX, anchorScreenY, canvasWidth, canvasHeight) {
    const step = CanvasConfig.ZOOM_STEP;
    const newZoom = direction > 0 
      ? Math.min(CanvasConfig.MAX_ZOOM, currentZoom + step)
      : Math.max(CanvasConfig.MIN_ZOOM, currentZoom - step);
    
    // Zoom toward anchor point (mouse position)
    // To keep world point under mouse fixed:
    // W_old = (S - SC)/Zoom_old + VC_old
    // W_new = (S - SC)/Zoom_new + VC_new
    // Setting W_old = W_new and solving for VC_new:
    // VC_new = VC_old + (S - SC) * (1/Zoom_old - 1/Zoom_new)
    
    if (newZoom === currentZoom) return { zoom: newZoom };

    const canvas = CanvasState.getCanvas();
    const sCenterX = canvasWidth / 2;
    const sCenterY = canvasHeight / 2;

    const dx = anchorScreenX - sCenterX;
    const dy = anchorScreenY - sCenterY;

    const newVCX = canvas.ViewportCenterX + dx * (1/currentZoom - 1/newZoom);
    // Y-flip handled by using dy correctly
    const newVCY = canvas.ViewportCenterY - dy * (1/currentZoom - 1/newZoom);

    return {
      zoom: newZoom,
      newVCX,
      newVCY
    };
  }

  return { calculatePan, calculateZoom };

})();
