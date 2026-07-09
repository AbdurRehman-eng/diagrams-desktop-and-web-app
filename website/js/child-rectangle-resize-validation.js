/**
 * child-rectangle-resize-validation.js
 * ======================================
 * Milestone 9 — Phase 9.2
 * Validates a candidate child rectangle resize against the parent rectangle
 * containment rules using Protection Padding boundaries.
 *
 * Containment rules (strict no-touch, Milestone 9 document):
 *   ChildProtectionLeftX   > ParentInnerLeftX
 *   ChildProtectionRightX  < ParentInnerRightX
 *   ChildProtectionTopY    < ParentInnerTopY
 *   ChildProtectionBottomY > ParentInnerBottomY
 */

'use strict';

const ChildRectangleResizeValidation = (() => {

  console.log('[ChildRectangleResizeValidation] MODULE LOADED - Version M9.2');

  const EPSILON = 0.5;

  /**
   * validate
   * --------
   * @param {number} CandidateChildCenterX
   * @param {number} CandidateChildCenterY
   * @param {number} CandidateChildHalfWidth
   * @param {number} CandidateChildHalfHeight
   * @param {number} ChildProtectionPaddingX
   * @param {number} ChildProtectionPaddingY
   * @param {number} ParentInnerLeftX
   * @param {number} ParentInnerRightX
   * @param {number} ParentInnerTopY
   * @param {number} ParentInnerBottomY
   * @returns {{ valid: boolean, reason: string }}
   */
  function validate(
      CandidateChildCenterX,
      CandidateChildCenterY,
      CandidateChildHalfWidth,
      CandidateChildHalfHeight,
      ChildProtectionPaddingX,
      ChildProtectionPaddingY,
      ParentInnerLeftX,
      ParentInnerRightX,
      ParentInnerTopY,
      ParentInnerBottomY
  ) {
      // Derive candidate Protection Padding boundaries — M9 document equation
      const ppResult = recalculateChildRectangleProtectionPadding(
          CandidateChildCenterX,
          CandidateChildCenterY,
          CandidateChildHalfWidth,
          CandidateChildHalfHeight,
          ChildProtectionPaddingX,
          ChildProtectionPaddingY
      );
      if (!ppResult) return { valid: false, reason: 'Protection padding calculation failed' };

      const { ChildProtectionLeftX, ChildProtectionRightX,
              ChildProtectionTopY,  ChildProtectionBottomY } = ppResult;

      // Strict no-touch containment inequalities (Milestone 9 Rule 3)
      if (ChildProtectionLeftX   <= ParentInnerLeftX   + EPSILON)
          return { valid: false, reason: 'Rectangle exceeds parent left boundary'   };
      if (ChildProtectionRightX  >= ParentInnerRightX  - EPSILON)
          return { valid: false, reason: 'Rectangle exceeds parent right boundary'  };
      if (ChildProtectionTopY    >= ParentInnerTopY    - EPSILON)
          return { valid: false, reason: 'Rectangle exceeds parent top boundary'    };
      if (ChildProtectionBottomY <= ParentInnerBottomY + EPSILON)
          return { valid: false, reason: 'Rectangle exceeds parent bottom boundary' };

      return { valid: true, reason: 'ok' };
  }

  return { validate };

})();
