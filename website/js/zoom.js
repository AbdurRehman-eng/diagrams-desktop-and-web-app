/**
 * zoom.js
 * =======
 */

'use strict';

const ZoomHandler = (() => {

  function onWheel(e) {
    const canvas = CanvasState.getCanvas();
    if (!canvas || !canvas.ZoomEnabled) return;

    e.preventDefault();

    const direction = e.deltaY < 0 ? 1 : -1;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const result = ViewportMath.calculateZoom(
      canvas.ZoomScale,
      direction,
      mouseX,
      mouseY,
      rect.width,
      rect.height
    );

    if (result.newVCX !== undefined) {
      CanvasState.updateCanvas({
        ZoomScale: result.zoom,
        ViewportCenterX: result.newVCX,
        ViewportCenterY: result.newVCY
      });
    } else {
      CanvasState.updateCanvas({ ZoomScale: result.zoom });
    }

    RenderCanvas.render();
  }

  function zoomByDelta(direction) {
    const canvas = CanvasState.getCanvas();
    const container = document.getElementById('MainCanvasViewport');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    
    // Zoom toward center of canvas when no mouse anchor
    const result = ViewportMath.calculateZoom(
      canvas.ZoomScale,
      direction,
      rect.width / 2,
      rect.height / 2,
      rect.width,
      rect.height
    );

    // BUG-14 fix: newVCX/newVCY are undefined when zoom is already at limit
    if (result.newVCX !== undefined) {
      CanvasState.updateCanvas({
        ZoomScale: result.zoom,
        ViewportCenterX: result.newVCX,
        ViewportCenterY: result.newVCY
      });
    } else {
      CanvasState.updateCanvas({ ZoomScale: result.zoom });
    }

    RenderCanvas.render();
  }

  return { onWheel, zoomByDelta };

})();
