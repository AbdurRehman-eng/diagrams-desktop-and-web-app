/**
 * child-rectangle-protection-padding.js
 * =====================================
 * Recalculates the child rectangle's Protection Padding boundaries 
 * based on its center, half-width, half-height, and padding.
 */

'use strict';

window.recalculateChildRectangleProtectionPadding = function(
    ChildCenterX, 
    ChildCenterY, 
    ChildHalfWidth, 
    ChildHalfHeight, 
    ChildProtectionPaddingX, 
    ChildProtectionPaddingY
) {
    // Basic validation
    if (isNaN(ChildCenterX) || isNaN(ChildCenterY)) return null;

    return {
        ChildProtectionLeftX: ChildCenterX - ChildHalfWidth - ChildProtectionPaddingX,
        ChildProtectionRightX: ChildCenterX + ChildHalfWidth + ChildProtectionPaddingX,
        ChildProtectionTopY: ChildCenterY + ChildHalfHeight + ChildProtectionPaddingY,
        ChildProtectionBottomY: ChildCenterY - ChildHalfHeight - ChildProtectionPaddingY
    };
};
