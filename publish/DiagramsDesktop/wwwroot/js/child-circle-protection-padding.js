/**
 * child-circle-protection-padding.js
 * ====================================
 * Milestone 9 — Phase 9.4
 * Recalculates the child circle's Protection Padding values and
 * protection-padded boundaries from its canonical geometry.
 *
 * Exact equations from the Milestone 9 specification:
 *   ChildProtectionPaddedRadius = ChildCircleRadius + ChildCircleProtectionPadding
 *   ChildProtectionLeftX        = ChildCircleCenterX - ChildProtectionPaddedRadius
 *   ChildProtectionRightX       = ChildCircleCenterX + ChildProtectionPaddedRadius
 *   ChildProtectionTopY         = ChildCircleCenterY + ChildProtectionPaddedRadius
 *   ChildProtectionBottomY      = ChildCircleCenterY - ChildProtectionPaddedRadius
 */

'use strict';

/**
 * recalculateChildCircleProtectionPadding
 * ----------------------------------------
 * @param {number} ChildCircleCenterX
 * @param {number} ChildCircleCenterY
 * @param {number} ChildCircleRadius
 * @param {number} ChildCircleProtectionPadding
 * @returns {{ ChildProtectionPaddedRadius,
 *             ChildProtectionLeftX, ChildProtectionRightX,
 *             ChildProtectionTopY,  ChildProtectionBottomY }}
 *          or null on invalid input.
 */
window.recalculateChildCircleProtectionPadding = function(
    ChildCircleCenterX,
    ChildCircleCenterY,
    ChildCircleRadius,
    ChildCircleProtectionPadding
) {
    if (isNaN(ChildCircleCenterX) || isNaN(ChildCircleCenterY)) return null;
    if (isNaN(ChildCircleRadius)  || ChildCircleRadius <= 0)     return null;
    if (isNaN(ChildCircleProtectionPadding) || ChildCircleProtectionPadding < 0)
        ChildCircleProtectionPadding = 0;

    // Milestone 9 document equation — verbatim
    const ChildProtectionPaddedRadius = ChildCircleRadius + ChildCircleProtectionPadding;

    return {
        ChildProtectionPaddedRadius,
        ChildProtectionLeftX:   ChildCircleCenterX - ChildProtectionPaddedRadius,
        ChildProtectionRightX:  ChildCircleCenterX + ChildProtectionPaddedRadius,
        ChildProtectionTopY:    ChildCircleCenterY + ChildProtectionPaddedRadius,
        ChildProtectionBottomY: ChildCircleCenterY - ChildProtectionPaddedRadius,
    };
};
