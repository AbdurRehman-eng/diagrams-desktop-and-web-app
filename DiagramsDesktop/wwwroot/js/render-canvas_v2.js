/**
 * render-canvas_v2.js
 * ===================
 * Version M2.8 - Nuclear Stability Fix
 */

'use strict';

const RenderCanvas = (() => {

  console.log('[RenderCanvas] MODULE LOADED - Version M2.8');

  let svgLayer = null;

  function init() {
    // Target the new specialized container ID
    svgLayer = document.getElementById('canvas-svg');
    if (!svgLayer) {
      const container = document.getElementById('MainCanvasViewport');
      if (!container) return;
      
      svgLayer = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
      svgLayer.id = 'canvas-svg';
      svgLayer.style.width = '100%';
      svgLayer.style.height = '100%';
      svgLayer.style.position = 'absolute';
      svgLayer.style.top = '0';
      svgLayer.style.left = '0';
      container.appendChild(svgLayer);
    }
    render();
  }

  function render() {
    if (!svgLayer) return;
    const canvas = CanvasState.getCanvas();
    if (!canvas) return;

    svgLayer.innerHTML = '';
    
    const container = document.getElementById('MainCanvasViewport');
    if (!container) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;

    RenderBackground.render(svgLayer, canvas);
    if (canvas.GridVisible) RenderGrid.render(svgLayer, canvas, width, height);
    if (canvas.ShowAxes) RenderAxes.render(svgLayer, canvas, width, height);
    if (canvas.ShowOriginMarker) RenderOrigin.render(svgLayer, canvas, width, height);
    // Connections (draw underneath shapes)
    if (typeof RenderConnections !== 'undefined') {
      RenderConnections.render(svgLayer, CanvasState.getActiveDiagram(), canvas.ZoomScale, width, height);
    }

    // Multi-shape rendering
    RenderShapes.render(svgLayer, canvas, width, height);

    // M8: Circle On Container rendering (above shapes so it occludes the border)
    if (typeof RenderCircleOnContainer !== 'undefined') {
      RenderCircleOnContainer.render(svgLayer, canvas, width, height);
    }
    
    // UI Update
    const zoomPct = Math.round(canvas.ZoomScale * 100);
    const zoomValueEl = document.getElementById('zoom-value');
    if (zoomValueEl) zoomValueEl.textContent = zoomPct + '%';

    const statusInfo = document.getElementById('status-canvas-info');
    if (statusInfo) {
      const count = CanvasState.getShapes().length;
      statusInfo.textContent = `World: [${Math.round(canvas.ViewportCenterX)}, ${Math.round(canvas.ViewportCenterY)}] · Shapes: ${count} · M2.8`;
    }

    const emptyState = document.getElementById('canvas-empty-state');
    if (emptyState) {
      emptyState.classList.toggle('hidden', CanvasState.getShapes().length > 0);
    }

    if (typeof DebugPanel !== 'undefined') DebugPanel.update();
  }

  return { init, render };

})();
