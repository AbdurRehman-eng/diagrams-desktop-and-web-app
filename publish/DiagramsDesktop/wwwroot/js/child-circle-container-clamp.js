/**
 * child-circle-container-clamp.js
 * =================================
 * Milestone 9 — Phase 9.4
 * Clamps a candidate child circle center so the child circle remains
 * fully inside the parent rectangle container under strict no-touch rules.
 *
 * Exact equations from the Milestone 9 specification:
 *   ClampedChildCircleCenterX = clamp(
 *       TargetChildCircleCenterX,
 *       ParentInnerLeftX  + ChildProtectionPaddedRadius + ε,
 *       ParentInnerRightX - ChildProtectionPaddedRadius - ε )
 *
 *   ClampedChildCircleCenterY = clamp(
 *       TargetChildCircleCenterY,
 *       ParentInnerBottomY + ChildProtectionPaddedRadius + ε,
 *       ParentInnerTopY    - ChildProtectionPaddedRadius - ε )
 */

'use strict';

/**
 * clampChildCircleCenterWithinParent
 * ------------------------------------
 * @param {number} TargetChildCircleCenterX
 * @param {number} TargetChildCircleCenterY
 * @param {number} ParentInnerLeftX
 * @param {number} ParentInnerRightX
 * @param {number} ParentInnerTopY
 * @param {number} ParentInnerBottomY
 * @param {number} ChildProtectionPaddedRadius
 * @param {number} [epsilon=0.5]   strict no-touch safety margin (world units)
 * @returns {{ ClampedChildCircleCenterX, ClampedChildCircleCenterY }}
 */
window.clampChildCircleCenterWithinParent = function(
    TargetChildCircleCenterX,
    TargetChildCircleCenterY,
    ParentInnerLeftX,
    ParentInnerRightX,
    ParentInnerTopY,
    ParentInnerBottomY,
    ChildProtectionPaddedRadius,
    epsilon = 0.5
) {
    // Milestone 9 document equations — verbatim
    const minX = ParentInnerLeftX   + ChildProtectionPaddedRadius + epsilon;
    const maxX = ParentInnerRightX  - ChildProtectionPaddedRadius - epsilon;
    const minY = ParentInnerBottomY + ChildProtectionPaddedRadius + epsilon;
    const maxY = ParentInnerTopY    - ChildProtectionPaddedRadius - epsilon;

    const ClampedChildCircleCenterX = Math.max(minX, Math.min(maxX, TargetChildCircleCenterX));
    const ClampedChildCircleCenterY = Math.max(minY, Math.min(maxY, TargetChildCircleCenterY));

    return { ClampedChildCircleCenterX, ClampedChildCircleCenterY };
};
