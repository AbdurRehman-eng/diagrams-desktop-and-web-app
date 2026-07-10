/**
 * child-circle-resize-validation.js
 * ====================================
 * Milestone 9 — Phase 9.5
 * Validates a candidate child circle resize against the parent rectangle
 * containment rules using Protection Padding boundaries.
 *
 * Containment rules (strict no-touch, Milestone 9 document):
 *   ChildProtectionLeftX   > ParentInnerLeftX
 *   ChildProtectionRightX  < ParentInnerRightX
 *   ChildProtectionTopY    < ParentInnerTopY
 *   ChildProtectionBottomY > ParentInnerBottomY
 */

'use strict';

const ChildCircleResizeValidation = (() => {

  console.log('[ChildCircleResizeValidation] MODULE LOADED - Version M9.5');

  const EPSILON = 0.5;

  /**
   * validate
   * --------
   * @param {number} CandidateChildCircleCenterX
   * @param {number} CandidateChildCircleCenterY
   * @param {number} CandidateChildCircleRadius
   * @param {number} ChildCircleProtectionPadding
   * @param {number} ParentInnerLeftX
   * @param {number} ParentInnerRightX
   * @param {number} ParentInnerTopY
   * @param {number} ParentInnerBottomY
   * @returns {{ valid: boolean, reason: string, clampedRadius: number|null }}
   */
  function validate(
      CandidateChildCircleCenterX,
      CandidateChildCircleCenterY,
      CandidateChildCircleRadius,
      ChildCircleProtectionPadding,
      ParentInnerLeftX,
      ParentInnerRightX,
      ParentInnerTopY,
      ParentInnerBottomY
  ) {
      if (isNaN(CandidateChildCircleRadius) || CandidateChildCircleRadius <= 0)
          return { valid: false, reason: 'Invalid radius', clampedRadius: null };

      // Derive candidate padded boundaries using M9 equation
      const ppResult = recalculateChildCircleProtectionPadding(
          CandidateChildCircleCenterX,
          CandidateChildCircleCenterY,
          CandidateChildCircleRadius,
          ChildCircleProtectionPadding
      );
      if (!ppResult) return { valid: false, reason: 'Protection padding calculation failed', clampedRadius: null };

      const { ChildProtectionPaddedRadius,
              ChildProtectionLeftX, ChildProtectionRightX,
              ChildProtectionTopY,  ChildProtectionBottomY } = ppResult;

      // Strict no-touch containment inequalities
      if (ChildProtectionLeftX   <= ParentInnerLeftX   + EPSILON)
          return { valid: false, reason: 'Circle exceeds parent left boundary',   clampedRadius: _clampedRadius(CandidateChildCircleCenterX - ParentInnerLeftX   - ChildCircleProtectionPadding - EPSILON) };
      if (ChildProtectionRightX  >= ParentInnerRightX  - EPSILON)
          return { valid: false, reason: 'Circle exceeds parent right boundary',  clampedRadius: _clampedRadius(ParentInnerRightX  - CandidateChildCircleCenterX - ChildCircleProtectionPadding - EPSILON) };
      if (ChildProtectionTopY    >= ParentInnerTopY    - EPSILON)
          return { valid: false, reason: 'Circle exceeds parent top boundary',    clampedRadius: _clampedRadius(ParentInnerTopY    - CandidateChildCircleCenterY - ChildCircleProtectionPadding - EPSILON) };
      if (ChildProtectionBottomY <= ParentInnerBottomY + EPSILON)
          return { valid: false, reason: 'Circle exceeds parent bottom boundary', clampedRadius: _clampedRadius(CandidateChildCircleCenterY - ParentInnerBottomY - ChildCircleProtectionPadding - EPSILON) };

      return { valid: true, reason: 'ok', clampedRadius: CandidateChildCircleRadius };
  }

  function _clampedRadius(candidate) {
      return Math.max(5, candidate);
  }

  return { validate };

})();
