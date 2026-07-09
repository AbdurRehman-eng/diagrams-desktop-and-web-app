/**
 * circle-resize.js
 * ================
 * Resizes the circle from 4 control points, modifying only Radius.
 */
'use strict';

const CircleResize = (() => {

  const MIN_RADIUS = 10;

  function handleResizeTick(circle, deltaX, deltaY, controlPointName) {
    if (!circle || circle.type !== 'circle') return;

    let newRadius = circle.Radius;

    // Depending on which handle is dragged, we update the radius
    // Since it's a circle, dx or dy from center becomes the new radius
    switch (controlPointName) {
      case 'TopResizeControlPoint':
        // Moving up (positive Y) increases radius
        newRadius += deltaY;
        break;
      case 'BottomResizeControlPoint':
        // Moving down (negative Y) increases radius
        newRadius -= deltaY;
        break;
      case 'RightResizeControlPoint':
        // Moving right (positive X) increases radius
        newRadius += deltaX;
        break;
      case 'LeftResizeControlPoint':
        // Moving left (negative X) increases radius
        newRadius -= deltaX;
        break;
    }

    if (newRadius < MIN_RADIUS) {
      newRadius = MIN_RADIUS;
    }

    CircleInteractionState.temporaryCandidateRadius = newRadius;
  }

  function commitResize(circle) {
    if (!circle || circle.type !== 'circle') return;

    // Apply
    circle.Radius = CircleInteractionState.temporaryCandidateRadius;

    // Recalculate
    if (typeof CircleDerivedGeometry !== 'undefined') {
      CircleDerivedGeometry.recalculate(circle);
    }

    // Clean up
    CircleInteractionState.temporaryCandidateRadius = 0;
    CircleInteractionState.activeResizeControlPoint = null;
    CircleInteractionState.isResizing = false;

    // Mark dirty
    if (typeof DirtyTracker !== 'undefined') {
      DirtyTracker.markDirty();
    }

    // Dispatch Milestone 7 connection recalculation hook
    if (typeof CircleEvents !== 'undefined') {
      CircleEvents.dispatchResized(circle.id);
    }
  }

  return { handleResizeTick, commitResize };
})();
