/**
 * circle-hover-selection.js
 * =========================
 * Detects pointer intersection against circle bounds, padding, and resize handles.
 */
'use strict';

const CircleHoverSelection = (() => {

  // Distance formula for circle hit testing
  function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  function hitTest(worldX, worldY, circle) {
    if (!circle || circle.type !== 'circle') return null;

    // Check resize control points first
    if (circle.resizeControlPoints) {
      const handleRadius = 5 / CanvasState.zoom; // approximate size scaled
      for (const [key, pt] of Object.entries(circle.resizeControlPoints)) {
        if (getDistance(worldX, worldY, pt.x, pt.y) <= handleRadius) {
          return { hit: true, target: 'resize', handle: key, cursor: pt.cursor };
        }
      }
    }

    // Check circle body & hover padding
    const dist = getDistance(worldX, worldY, circle.WorldX, circle.WorldY);
    
    if (dist <= circle.Radius) {
      return { hit: true, target: 'body', cursor: 'move' };
    }
    
    if (dist <= circle.HoverPaddedRadius) {
      return { hit: true, target: 'hover-band', cursor: 'pointer' };
    }

    return { hit: false };
  }

  function onPointerMove(worldX, worldY, circles) {
    let hovered = null;
    let hoveredHandle = null;

    for (let i = circles.length - 1; i >= 0; i--) {
      const result = hitTest(worldX, worldY, circles[i]);
      if (result.hit) {
        hovered = circles[i].id;
        if (result.target === 'resize') {
          hoveredHandle = result.handle;
        }
        break; // Topmost circle
      }
    }

    CircleInteractionState.hoveredCircleId = hovered;
    return { hoveredCircleId: hovered, hoveredHandle };
  }

  function onPointerDown(worldX, worldY, circles) {
    const { hoveredCircleId, hoveredHandle } = onPointerMove(worldX, worldY, circles);
    
    if (hoveredCircleId) {
      CircleInteractionState.selectedCircleId = hoveredCircleId;
      if (hoveredHandle) {
        CircleInteractionState.isResizing = true;
        CircleInteractionState.activeResizeControlPoint = hoveredHandle;
      } else {
        CircleInteractionState.isDragging = true;
      }
    } else {
      CircleInteractionState.selectedCircleId = null;
      CircleInteractionState.isResizing = false;
      CircleInteractionState.isDragging = false;
    }
  }

  return { hitTest, onPointerMove, onPointerDown };
})();
