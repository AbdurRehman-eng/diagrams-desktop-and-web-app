/**
 * enumerate-container-subtree.js
 * ================================
 * Recursively gathers all descendant shape IDs for a given root container/shape.
 */

'use strict';

const EnumerateContainerSubtree = (() => {

  /**
   * getDescendants
   * Recursively finds all shape IDs that belong to the subtree of rootId.
   * @param {string} rootId - The root shape ID.
   * @param {Array} allShapes - Array of all shapes in the canvas state.
   * @returns {Array<string>} List of descendant shape IDs.
   */
  function getDescendants(rootId, allShapes) {
    const descendants = [];
    const queue = [rootId];

    while (queue.length > 0) {
      const currentId = queue.shift();
      const children = allShapes.filter(s => s.ParentContainerID === currentId);
      for (const child of children) {
        if (!descendants.includes(child.ShapeID)) {
          descendants.push(child.ShapeID);
          queue.push(child.ShapeID);
        }
      }
    }

    return descendants;
  }

  return {
    getDescendants
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnumerateContainerSubtree;
}
