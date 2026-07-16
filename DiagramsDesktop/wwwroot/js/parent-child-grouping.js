/**
 * parent-child-grouping.js
 * =======================
 * Milestone 10 — Phase 10.1 / 10.4
 * Groups children by their ParentContainerID.
 */

'use strict';

const ParentChildGrouping = (() => {

  console.log('[ParentChildGrouping] MODULE LOADED');

  /**
   * getChildrenOfParent
   * Returns all shapes that belong to the given parentId.
   * @param {string} parentId
   * @param {object[]} allShapes
   * @returns {object[]}
   */
  function getChildrenOfParent(parentId, allShapes) {
    if (!parentId) return [];
    return allShapes.filter(s => s.ParentContainerID === parentId);
  }

  /**
   * groupAllChildrenByParent
   * Returns an object mapping ParentContainerID -> array of child shapes.
   * @param {object[]} allShapes
   * @returns {object}
   */
  function groupAllChildrenByParent(allShapes) {
    const groups = {};
    for (const shape of allShapes) {
      const pId = shape.ParentContainerID;
      if (!pId) continue;
      if (!groups[pId]) {
        groups[pId] = [];
      }
      groups[pId].push(shape);
    }
    return groups;
  }

  return {
    getChildrenOfParent,
    groupAllChildrenByParent
  };

})();

// Export for Node environments if loaded under test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ParentChildGrouping;
} else {
  window.ParentChildGrouping = ParentChildGrouping;
}
