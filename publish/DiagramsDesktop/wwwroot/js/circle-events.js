/**
 * circle-events.js
 * ================
 * Exposes clean circle-moved and circle-resized completion events.
 * Listened to by Milestone 7 connection recalculation logic.
 */
'use strict';

const CircleEvents = (() => {
  
  function dispatchMoved(circleId) {
    const event = new CustomEvent('circle-moved', {
      detail: { circleId }
    });
    document.dispatchEvent(event);
  }

  function dispatchResized(circleId) {
    const event = new CustomEvent('circle-resized', {
      detail: { circleId }
    });
    document.dispatchEvent(event);
  }

  return {
    dispatchMoved,
    dispatchResized
  };
})();
