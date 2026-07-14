/**
 * move-container-subtree.js
 * =========================
 * Translates descendants of a dragged container in real-time.
 */

'use strict';

const MoveContainerSubtree = (() => {

  /**
   * translateSubtree
   * Translates each descendant in the subtree by the parent's delta movement.
   * @param {Array<string>} descendantIds - List of descendant shape IDs.
   * @param {number} deltaX - The change in world coordinates on the X axis.
   * @param {number} deltaY - The change in world coordinates on the Y axis.
   * @param {Object} childSnapshots - Snapshot coordinates of descendants at drag-start.
   */
  function translateSubtree(descendantIds, deltaX, deltaY, childSnapshots) {
    for (const childId of descendantIds) {
      const snap = childSnapshots[childId];
      if (snap) {
        CanvasState.updateShape(childId, {
          WorldX: snap.WorldX + deltaX,
          WorldY: snap.WorldY + deltaY
        });
      }
    }
  }

  return {
    translateSubtree
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MoveContainerSubtree;
}
