/**
 * containment-protection-padding-recalculation.js
 * =================================================
 * Milestone 9 — Phase 9.7
 * Recalculates all committed Protection Padding geometry before save.
 * Called from the save flow to ensure derived geometry is correct.
 */

'use strict';

const ContainmentProtectionPaddingRecalculation = (() => {

  console.log('[ContainmentProtectionPaddingRecalculation] MODULE LOADED - Version M9.7');

  /**
   * recalculateAll
   * Recalculates all parent-child Protection Padding geometry.
   * @param {object[]} allShapes   All shapes from CanvasState
   * @returns {{ ok: boolean, errors: string[] }}
   */
  function recalculateAll(allShapes) {
    if (typeof MultiChildContainmentProtectionPaddingRecalculation !== 'undefined') {
      return MultiChildContainmentProtectionPaddingRecalculation.recalculateAllMultiChildContainmentProtectionPaddingGeometry(
        null, null, null, allShapes, null, null
      );
    }

    const errors = [];
    const containerShapes = allShapes.filter(s => s.ParentContainerID);

    for (const child of containerShapes) {
      const parent = allShapes.find(s => s.ShapeID === child.ParentContainerID);
      if (!parent) {
        errors.push(`Child "${child.ShapeID}" has no matching parent "${child.ParentContainerID}".`);
        continue;
      }
      const result = ContainmentEngine.validateChildInParent(child, parent);
      if (!result.valid) {
        errors.push(`Child "${child.Label || child.ShapeID}" fails containment: ${result.reason}`);
      }
    }
    return { ok: errors.length === 0, errors };
  }

  return { recalculateAll };

})();
