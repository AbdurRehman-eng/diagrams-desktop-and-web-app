/**
 * circle-move.js
 * ==============
 * Updates CenterX and CenterY, re-evaluates bounding boxes, and emits circle-moved.
 */
'use strict';

const CircleMove = (() => {

  function updateTemporaryCenter(circleId, newX, newY) {
    CircleInteractionState.temporaryCandidateCenterX = newX;
    CircleInteractionState.temporaryCandidateCenterY = newY;
  }

  function commitMove(circle) {
    if (!circle || circle.type !== 'circle') return;
    
    // Apply temporary candidate
    circle.WorldX = CircleInteractionState.temporaryCandidateCenterX;
    circle.WorldY = CircleInteractionState.temporaryCandidateCenterY;
    
    // Recalculate derived boundaries
    if (typeof CircleDerivedGeometry !== 'undefined') {
      CircleDerivedGeometry.recalculate(circle);
    }
    
    // Clear interaction state
    CircleInteractionState.temporaryCandidateCenterX = 0;
    CircleInteractionState.temporaryCandidateCenterY = 0;
    
    // Mark diagram as dirty
    if (typeof DirtyTracker !== 'undefined') {
      DirtyTracker.markDirty();
    }
    
    // Dispatch Milestone 7 connection recalculation hook
    if (typeof CircleEvents !== 'undefined') {
      CircleEvents.dispatchMoved(circle.id);
    }
  }

  return { updateTemporaryCenter, commitMove };
})();
