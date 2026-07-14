/**
 * sibling-rectangle-overlap-validation.js
 * =========================================
 * Milestone 10 — Phase 10.1 / 10.2
 * Validates sibling overlap for child rectangles inside the same parent.
 */

'use strict';

const SiblingRectangleOverlapValidation = (() => {

  console.log('[SiblingRectangleOverlapValidation] MODULE LOADED');

  /**
   * validateChildRectangleAgainstSiblingRectangles
   * Checks if the active child rectangle overlaps or touches any sibling rectangle.
   */
  function validateChildRectangleAgainstSiblingRectangles(
    ActiveChildRectangleID,
    activeChildRectangleProtectionPaddingBoundaries,
    SiblingRectangleSet,
    strictSiblingNoTouchRule = true
  ) {
    if (!activeChildRectangleProtectionPaddingBoundaries) {
      return { valid: false, reason: 'Invalid active child padding boundaries' };
    }

    const a = activeChildRectangleProtectionPaddingBoundaries;

    for (const sib of SiblingRectangleSet) {
      if (sib.ShapeID === ActiveChildRectangleID) continue;

      const geom = (sib.GeometryType || sib.Type || '').toLowerCase();
      const isCircle = geom === 'circle' || geom === 'ellipse';

      if (isCircle) {
        // Rectangle vs Circle overlap check using Protection Padding
        const sibRadius = sib.Radius ?? sib.Width / 2;
        const sibPadding = typeof ContainmentEngine !== 'undefined' ? ContainmentEngine.getCircleProtectionPadding(sib) : 0;
        const sibPaddedR = sibRadius + sibPadding;
        
        // Find closest point on padded rectangle to circle center
        const px = Math.max(a.ChildProtectionLeftX, Math.min(sib.WorldX, a.ChildProtectionRightX));
        const py = Math.max(a.ChildProtectionBottomY, Math.min(sib.WorldY, a.ChildProtectionTopY));
        const dist2 = (sib.WorldX - px) ** 2 + (sib.WorldY - py) ** 2;

        if (dist2 <= sibPaddedR ** 2) {
          return { valid: false, reason: `Overlaps circle sibling "${sib.Label || sib.ShapeID}"` };
        }
      } else {
        // Rectangle vs Rectangle:
        let sibPP;
        if (typeof ContainmentEngine !== 'undefined') {
          const { ChildProtectionPaddingX: px, ChildProtectionPaddingY: py } = ContainmentEngine.getRectProtectionPadding(sib);
          sibPP = window.recalculateChildRectangleProtectionPadding(sib.WorldX, sib.WorldY, sib.Width / 2, sib.Height / 2, px, py);
        } else {
          sibPP = window.recalculateChildRectangleProtectionPadding(sib.WorldX, sib.WorldY, sib.Width / 2, sib.Height / 2, 0, 0);
        }

        if (!sibPP) continue;

        const overlap = (
          a.ChildProtectionLeftX   <= sibPP.ChildProtectionRightX  &&
          a.ChildProtectionRightX  >= sibPP.ChildProtectionLeftX   &&
          a.ChildProtectionBottomY <= sibPP.ChildProtectionTopY    &&
          a.ChildProtectionTopY    >= sibPP.ChildProtectionBottomY
        );

        if (overlap) {
          return { valid: false, reason: `Overlaps rectangle sibling "${sib.Label || sib.ShapeID}"` };
        }
      }
    }

    return { valid: true, reason: 'ok' };
  }

  /**
   * validateChildRectangleResizeAgainstSiblingRectangles
   * Checks if candidate resized boundaries overlap any sibling.
   */
  function validateChildRectangleResizeAgainstSiblingRectangles(
    ActiveChildRectangleID,
    candidateChildRectangleProtectionPaddingBoundaries,
    SiblingRectangleSet,
    strictSiblingNoTouchRule = true
  ) {
    return validateChildRectangleAgainstSiblingRectangles(
      ActiveChildRectangleID,
      candidateChildRectangleProtectionPaddingBoundaries,
      SiblingRectangleSet,
      strictSiblingNoTouchRule
    );
  }

  return {
    validateChildRectangleAgainstSiblingRectangles,
    validateChildRectangleResizeAgainstSiblingRectangles
  };

})();

// Export for Node environments if loaded under test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SiblingRectangleOverlapValidation;
} else {
  window.SiblingRectangleOverlapValidation = SiblingRectangleOverlapValidation;
}
