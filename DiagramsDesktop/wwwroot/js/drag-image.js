/**
 * drag-image.js
 * =============
 */

'use strict';

const DragImageHandler = (() => {

  let isDragging = false;
  let draggedObjId = null;
  let dragStartWorldPos = null;
  let objStartWorldPos = null;

  function init() {
    const container = document.getElementById('MainCanvasViewport');
    if (!container) return;

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }

  function onMouseDown(e) {
    const target = e.target.closest('[data-obj-id]');
    if (!target) return;

    e.stopPropagation();
    
    draggedObjId = target.dataset.objId;
    isDragging = true;

    const rect = document.getElementById('MainCanvasViewport').getBoundingClientRect();
    const worldPos = ScreenToWorld.convert(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );

    dragStartWorldPos = worldPos;
    
    const diagram = CanvasState.getActiveDiagram();
    objStartWorldPos = {
      x: diagram.TestObject.worldX,
      y: diagram.TestObject.worldY
    };

    document.body.style.cursor = 'move';
  }

  function onMouseMove(e) {
    if (!isDragging) return;

    const rect = document.getElementById('MainCanvasViewport').getBoundingClientRect();
    const currentWorldPos = ScreenToWorld.convert(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );

    const dx = currentWorldPos.x - dragStartWorldPos.x;
    const dy = currentWorldPos.y - dragStartWorldPos.y;

    CanvasState.updateTestObject({
      worldX: objStartWorldPos.x + dx,
      worldY: objStartWorldPos.y + dy
    });

    RenderCanvas.render();
  }

  function onMouseUp() {
    if (!isDragging) return;
    isDragging = false;
    draggedObjId = null;
    document.body.style.cursor = 'default';
  }

  return { init };

})();
