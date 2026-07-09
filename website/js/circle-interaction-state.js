/**
 * circle-interaction-state.js
 * ===========================
 * Manages the temporary runtime state for circle interaction (hover, selection, resize).
 * This state is NOT saved as committed diagram truth.
 */
'use strict';

const CircleInteractionState = (() => {
  let hoveredCircleId = null;
  let selectedCircleId = null;
  let isDragging = false;
  let isResizing = false;
  let activeResizeControlPoint = null;
  let temporaryCandidateCenterX = 0;
  let temporaryCandidateCenterY = 0;
  let temporaryCandidateRadius = 0;

  return {
    get hoveredCircleId() { return hoveredCircleId; },
    set hoveredCircleId(id) { hoveredCircleId = id; },

    get selectedCircleId() { return selectedCircleId; },
    set selectedCircleId(id) { selectedCircleId = id; },

    get isDragging() { return isDragging; },
    set isDragging(val) { isDragging = val; },

    get isResizing() { return isResizing; },
    set isResizing(val) { isResizing = val; },

    get activeResizeControlPoint() { return activeResizeControlPoint; },
    set activeResizeControlPoint(val) { activeResizeControlPoint = val; },

    get temporaryCandidateCenterX() { return temporaryCandidateCenterX; },
    set temporaryCandidateCenterX(val) { temporaryCandidateCenterX = val; },

    get temporaryCandidateCenterY() { return temporaryCandidateCenterY; },
    set temporaryCandidateCenterY(val) { temporaryCandidateCenterY = val; },

    get temporaryCandidateRadius() { return temporaryCandidateRadius; },
    set temporaryCandidateRadius(val) { temporaryCandidateRadius = val; },

    clear() {
      hoveredCircleId = null;
      selectedCircleId = null;
      isDragging = false;
      isResizing = false;
      activeResizeControlPoint = null;
    }
  };
})();
