/**
 * sibling-circle-overlap-validation.js
 * =====================================
 * Milestone 10 — Phase 10.4 / 10.5
 * Validates sibling overlap for child circles inside the same parent.
 */

'use strict';

const SiblingCircleOverlapValidation = (() => {

  console.log('[SiblingCircleOverlapValidation] MODULE LOADED');

  /**
   * validateChildCircleAgainstSiblingCircles
   * Checks if the active child circle overlaps or touches any sibling circle.
   */
  function validateChildCircleAgainstSiblingCircles(
    ActiveChildCircleID,
    candidateChildCircleCenter,
    candidateChildProtectionPaddedRadius,
    SiblingCircleSet,
    strictSiblingNoTouchRule = true
  ) {
    if (!candidateChildCircleCenter || isNaN(candidateChildProtectionPaddedRadius)) {
      return { valid: false, reason: 'Invalid active child circle parameters' };
    }

    const cxA = candidateChildCircleCenter.cx ?? candidateChildCircleCenter.x;
    const cyA = candidateChildCircleCenter.cy ?? candidateChildCircleCenter.y;
    const rA  = candidateChildProtectionPaddedRadius;

    for (const sib of SiblingCircleSet) {
      if (sib.ShapeID === ActiveChildCircleID) continue;

      const geom = (sib.GeometryType || sib.Type || '').toLowerCase();
      const isCircle = geom === 'circle' || geom === 'ellipse';

      if (isCircle) {
        // Circle vs Circle
        const sibRadius = sib.Radius ?? sib.Width / 2;
        const sibPadding = typeof ContainmentEngine !== 'undefined' ? ContainmentEngine.getCircleProtectionPadding(sib) : 0;
        const sibPaddedR = sibRadius + sibPadding;
        
        const d2 = (cxA - sib.WorldX) ** 2 + (cyA - sib.WorldY) ** 2;
        const sumR = rA + sibPaddedR;

        if (d2 <= sumR * sumR) {
          return { valid: false, reason: `Overlaps circle sibling "${sib.Label || sib.ShapeID}"` };
        }
      } else {
        // Circle vs Rectangle (padded)
        let sibPP;
        if (typeof ContainmentEngine !== 'undefined') {
          const { ChildProtectionPaddingX: px, ChildProtectionPaddingY: py } = ContainmentEngine.getRectProtectionPadding(sib);
          sibPP = window.recalculateChildRectangleProtectionPadding(sib.WorldX, sib.WorldY, sib.Width / 2, sib.Height / 2, px, py);
        } else {
          sibPP = window.recalculateChildRectangleProtectionPadding(sib.WorldX, sib.WorldY, sib.Width / 2, sib.Height / 2, 0, 0);
        }

        if (!sibPP) continue;

        // Find closest point on padded rectangle to circle center
        const px = Math.max(sibPP.ChildProtectionLeftX, Math.min(cxA, sibPP.ChildProtectionRightX));
        const py = Math.max(sibPP.ChildProtectionBottomY, Math.min(cyA, sibPP.ChildProtectionTopY));
        const dist2 = (cxA - px) ** 2 + (cyA - py) ** 2;

        if (dist2 <= rA ** 2) {
          return { valid: false, reason: `Overlaps rectangle sibling "${sib.Label || sib.ShapeID}"` };
        }
      }
    }

    return { valid: true, reason: 'ok' };
  }

  /**
   * validateChildCircleResizeAgainstSiblingCircles
   * Checks if candidate resized circle overlaps any sibling.
   */
  function validateChildCircleResizeAgainstSiblingCircles(
    ActiveChildCircleID,
    candidateChildCircleCenter,
    candidateChildProtectionPaddedRadius,
    SiblingCircleSet,
    strictSiblingNoTouchRule = true
  ) {
    return validateChildCircleAgainstSiblingCircles(
      ActiveChildCircleID,
      candidateChildCircleCenter,
      candidateChildProtectionPaddedRadius,
      SiblingCircleSet,
      strictSiblingNoTouchRule
    );
  }

  return {
    validateChildCircleAgainstSiblingCircles,
    validateChildCircleResizeAgainstSiblingCircles
  };

})();

// Export for Node environments if loaded under test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SiblingCircleOverlapValidation;
} else {
  window.SiblingCircleOverlapValidation = SiblingCircleOverlapValidation;
}
