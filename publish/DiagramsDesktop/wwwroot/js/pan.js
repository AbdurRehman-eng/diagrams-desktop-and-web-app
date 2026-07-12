/**
 * pan.js
 * ======
 * Version M2.8 - Nuclear Stability Fix
 */

'use strict';

const PanHandler = (() => {

  let _isPanning = false;
  let _lastMouseX = 0;
  let _lastMouseY = 0;

  function onMouseDown(e) {
    // NUCLEAR LOCK: If DragHandler or MoveCircleOnContainer is active, Pan must NEVER start
    if (typeof DragHandler !== 'undefined' && DragHandler.isActive()) {
      return;
    }
    if (typeof MoveCircleOnContainer !== 'undefined' && MoveCircleOnContainer.isActive()) {
      return;
    }

    const canvas = CanvasState.getCanvas();
    if (!canvas || !canvas.PanEnabled) return;

    _isPanning = true;
    _lastMouseX = e.clientX;
    _lastMouseY = e.clientY;
    
    document.body.style.cursor = 'grabbing';
  }

  function onMouseMove(e) {
    if (!_isPanning) return;

    const dx = e.clientX - _lastMouseX;
    const dy = e.clientY - _lastMouseY;

    const canvas = CanvasState.getCanvas();
    const panResult = ViewportMath.calculatePan(dx, dy, canvas.ZoomScale);

    CanvasState.updateCanvas({
      ViewportCenterX: canvas.ViewportCenterX + panResult.dX,
      ViewportCenterY: canvas.ViewportCenterY + panResult.dY
    });

    _lastMouseX = e.clientX;
    _lastMouseY = e.clientY;

    RenderCanvas.render();
  }

  function onMouseUp() {
    if (!_isPanning) return;
    _isPanning = false;
    document.body.style.cursor = 'default';
  }

  function isActive() {
    return _isPanning;
  }

  function cancel() {
    if (_isPanning) {
      _isPanning = false;
      document.body.style.cursor = 'default';
    }
  }

  return { onMouseDown, onMouseMove, onMouseUp, isActive, cancel };

})();
