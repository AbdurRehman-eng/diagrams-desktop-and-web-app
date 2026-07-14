/**
 * validate-container-subtree.js
 * =============================
 * Validates containment and sibling overlaps for all shapes in the moved subtree.
 */

'use strict';

const ValidateContainerSubtree = (() => {

  /**
   * validateSubtree
   * Validates the final positions of all shapes in a moved subtree.
   * @param {string} rootId - The root shape ID that was dragged.
   * @param {Array<string>} descendantIds - List of descendant shape IDs.
   * @param {Array} allShapes - Current canvas shapes.
   * @returns {Object} { valid: boolean, reason: string }
   */
  function validateSubtree(rootId, descendantIds, allShapes) {
    const subtreeIds = [rootId, ...descendantIds];

    for (const shapeId of subtreeIds) {
      const shape = allShapes.find(s => s.ShapeID === shapeId);
      if (!shape) continue;

      // 1. Parent Containment Check
      const parentId = shape.ParentContainerID;
      if (parentId) {
        // If the parent is outside the subtree, we must validate containment
        if (!subtreeIds.includes(parentId)) {
          const parentShape = allShapes.find(s => s.ShapeID === parentId);
          if (parentShape && typeof ContainmentEngine !== 'undefined') {
            const containRes = ContainmentEngine.validateChildInParent(shape, parentShape);
            if (!containRes.valid) {
              return {
                valid: false,
                reason: `Containment violation for ${shape.Label || shapeId}: ${containRes.reason}`
              };
            }
          }
        }
      }

      // 2. Sibling Overlap Check
      if (typeof ContainmentEngine !== 'undefined') {
        const siblings = ContainmentEngine.getSiblings(shapeId, allShapes)
          .filter(sib => !subtreeIds.includes(sib.ShapeID)); // Only check against siblings outside the subtree

        if (siblings.length > 0) {
          const geomType = (shape.GeometryType || shape.Type || '').toLowerCase();
          const isCircle = geomType === 'circle' || geomType === 'ellipse';

          if (isCircle && typeof SiblingCircleOverlapValidation !== 'undefined') {
            const r = shape.Radius ?? shape.Width / 2;
            const padding = ContainmentEngine.getCircleProtectionPadding(shape);
            const sibRes = SiblingCircleOverlapValidation.validateChildCircleAgainstSiblingCircles(
              shapeId,
              { x: shape.WorldX, y: shape.WorldY },
              r + padding,
              siblings
            );
            if (!sibRes.valid) {
              return {
                valid: false,
                reason: `Sibling overlap violation for circle ${shape.Label || shapeId}: ${sibRes.reason}`
              };
            }
          } else if (!isCircle && typeof SiblingRectangleOverlapValidation !== 'undefined') {
            const { ChildProtectionPaddingX: px, ChildProtectionPaddingY: py } = ContainmentEngine.getRectProtectionPadding(shape);
            const paddedBounds = window.recalculateChildRectangleProtectionPadding(
              shape.WorldX,
              shape.WorldY,
              shape.Width / 2,
              shape.Height / 2,
              px,
              py
            );
            if (paddedBounds) {
              const sibRes = SiblingRectangleOverlapValidation.validateChildRectangleAgainstSiblingRectangles(
                shapeId,
                paddedBounds,
                siblings
              );
              if (!sibRes.valid) {
                return {
                  valid: false,
                  reason: `Sibling overlap violation for rectangle ${shape.Label || shapeId}: ${sibRes.reason}`
                };
              }
            }
          } else {
            // Fallback: generic overlap check
            const sibResult = ContainmentEngine.checkSiblingOverlap(shape, siblings);
            if (sibResult.collided) {
              return {
                valid: false,
                reason: `Sibling overlap violation for ${shape.Label || shapeId}`
              };
            }
          }
        }
      }
    }

    return { valid: true };
  }

  return {
    validateSubtree
  };

})();
