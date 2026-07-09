/**
 * child-rectangle-container-clamp.js
 * ==================================
 * Clamps a candidate child rectangle center so it remains fully inside 
 * the parent rectangle container under strict no-touch rules.
 */

'use strict';

window.clampChildRectangleCenterWithinParent = function(
    TargetChildCenterX,
    TargetChildCenterY,
    ParentInnerLeftX,
    ParentInnerRightX,
    ParentInnerTopY,
    ParentInnerBottomY,
    ChildHalfWidth,
    ChildHalfHeight,
    ChildProtectionPaddingX,
    ChildProtectionPaddingY,
    epsilon = 0.5
) {
    const minX = ParentInnerLeftX + ChildHalfWidth + ChildProtectionPaddingX + epsilon;
    const maxX = ParentInnerRightX - ChildHalfWidth - ChildProtectionPaddingX - epsilon;
    const minY = ParentInnerBottomY + ChildHalfHeight + ChildProtectionPaddingY + epsilon;
    const maxY = ParentInnerTopY - ChildHalfHeight - ChildProtectionPaddingY - epsilon;

    // Direct practical form of the document’s general clamped movement rule
    const ClampedChildCenterX = Math.max(minX, Math.min(maxX, TargetChildCenterX));
    const ClampedChildCenterY = Math.max(minY, Math.min(maxY, TargetChildCenterY));

    return {
        ClampedChildCenterX,
        ClampedChildCenterY
    };
};
