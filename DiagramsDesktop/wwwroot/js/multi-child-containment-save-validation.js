/**
 * multi-child-containment-save-validation.js
 * ============================================
 * Milestone 10 — Phase 10.7
 * Validates the committed multi-child containment state before persistence.
 */

'use strict';

const MultiChildContainmentSaveValidation = (() => {

  console.log('[MultiChildContainmentSaveValidation] MODULE LOADED');

  /**
   * validateCommittedMultiChildContainmentState
   * Verifies containment and sibling non-overlap rules.
   */
  function validateCommittedMultiChildContainmentState(
    committedParentGeometry,
    committedChildRectangleGeometry,
    committedChildCircleGeometry,
    recalculatedProtectionPaddingBoundaries,
    parentChildReferenceCenterData,
    SiblingGroupingByImmediateParent
  ) {
    const errors = [];
    const geom = recalculatedProtectionPaddingBoundaries;
    if (!geom) {
      return { ok: false, errors: ['Recalculated protection padding boundaries missing'] };
    }

    const { parentBoundaries, childRectBoundaries, childCircleBoundaries, siblingGroups } = geom;

    // Validate parent containment and sibling non-overlap for each child
    for (const parentId in siblingGroups) {
      const siblings = siblingGroups[parentId];
      const parentInner = parentBoundaries[parentId];

      if (!parentInner) {
        errors.push(`Parent boundaries for "${parentId}" not derived`);
        continue;
      }

      for (const child of siblings) {
        const geomType = (child.GeometryType || child.Type || '').toLowerCase();
        const isCircle = geomType === 'circle' || geomType === 'ellipse';

        const childPP = isCircle 
          ? childCircleBoundaries[child.ShapeID] 
          : childRectBoundaries[child.ShapeID];

        if (!childPP) {
          errors.push(`Protection padding boundaries for child "${child.ShapeID}" not derived`);
          continue;
        }

        // 1. Parent Containment Check
        // Allow a small epsilon tolerance for float inaccuracies
        const eps = 1e-5;
        const leftOk   = childPP.ChildProtectionLeftX   >= parentInner.ParentInnerLeftX   - eps;
        const rightOk  = childPP.ChildProtectionRightX  <= parentInner.ParentInnerRightX  + eps;
        const topOk    = childPP.ChildProtectionTopY    <= parentInner.ParentInnerTopY    + eps;
        const bottomOk = childPP.ChildProtectionBottomY >= parentInner.ParentInnerBottomY - eps;

        if (!leftOk || !rightOk || !topOk || !bottomOk) {
          errors.push(`Child "${child.Label || child.ShapeID}" violates parent "${parentId}" containment boundaries.`);
        }

        // 2. Sibling Overlap Check
        if (isCircle) {
          const overlapRes = SiblingCircleOverlapValidation.validateChildCircleAgainstSiblingCircles(
            child.ShapeID,
            { x: child.WorldX, y: child.WorldY },
            childPP.ChildProtectionPaddedRadius,
            siblings
          );
          if (!overlapRes.valid) {
            errors.push(`Circle child "${child.Label || child.ShapeID}": ${overlapRes.reason}`);
          }
        } else {
          const overlapRes = SiblingRectangleOverlapValidation.validateChildRectangleAgainstSiblingRectangles(
            child.ShapeID,
            childPP,
            siblings
          );
          if (!overlapRes.valid) {
            errors.push(`Rectangle child "${child.Label || child.ShapeID}": ${overlapRes.reason}`);
          }
        }
      }
    }

    return {
      ok: errors.length === 0,
      errors
    };
  }

  return {
    validateCommittedMultiChildContainmentState
  };

})();

// Export for Node environments if loaded under test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiChildContainmentSaveValidation;
} else {
  window.MultiChildContainmentSaveValidation = MultiChildContainmentSaveValidation;
}
