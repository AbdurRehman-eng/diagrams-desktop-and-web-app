/**
 * multi-child-containment-protection-padding-recalculation.js
 * =============================================================
 * Milestone 10 — Phase 10.7
 * Recalculates all parent-child and sibling Protection Padding geometry
 * required for committed multi-child containment validation and persistence.
 */

'use strict';

const MultiChildContainmentProtectionPaddingRecalculation = (() => {

  console.log('[MultiChildContainmentProtectionPaddingRecalculation] MODULE LOADED');

  /**
   * recalculateAllMultiChildContainmentProtectionPaddingGeometry
   * Recalculates all parent inner boundaries and child protection padding boundaries.
   */
  function recalculateAllMultiChildContainmentProtectionPaddingGeometry(
    parentContainerCollection,
    childRectangleCollection,
    childCircleCollection,
    committedGeometryValues,
    parentChildRelationData,
    SiblingGroupingByImmediateParent
  ) {
    // If not provided, fallback to using all shapes from CanvasState
    let allShapes = committedGeometryValues;
    if (!allShapes && typeof CanvasState !== 'undefined') {
      allShapes = CanvasState.getShapes();
    }
    allShapes = allShapes || [];

    const errors = [];
    const parentBoundaries = {};
    const childRectBoundaries = {};
    const childCircleBoundaries = {};

    // 1. Group children and identify parents
    const children = allShapes.filter(s => s.ParentContainerID);
    
    let rects = childRectangleCollection;
    if (!rects) {
      rects = children.filter(s => {
        const t = (s.GeometryType || s.Type || '').toLowerCase();
        return t !== 'circle' && t !== 'ellipse';
      });
    }

    let circles = childCircleCollection;
    if (!circles) {
      circles = children.filter(s => {
        const t = (s.GeometryType || s.Type || '').toLowerCase();
        return t === 'circle' || t === 'ellipse';
      });
    }

    // 2. Recalculate parent inner usable boundaries
    const parents = allShapes.filter(p => children.some(c => c.ParentContainerID === p.ShapeID));
    for (const parent of parents) {
      if (typeof DeriveParentInnerBoundaries !== 'undefined') {
        const bounds = DeriveParentInnerBoundaries.fromShape(parent);
        if (bounds) {
          parentBoundaries[parent.ShapeID] = bounds;
        } else {
          errors.push(`Failed to derive boundaries for parent "${parent.ShapeID}"`);
        }
      } else {
        // Fallback boundary calculation for testing
        parentBoundaries[parent.ShapeID] = {
          ParentInnerLeftX: parent.WorldX - parent.Width / 2,
          ParentInnerRightX: parent.WorldX + parent.Width / 2,
          ParentInnerTopY: parent.WorldY + parent.Height / 2,
          ParentInnerBottomY: parent.WorldY - parent.Height / 2
        };
      }
    }

    // 3. Recalculate child rectangle protection padding boundaries
    for (const child of rects) {
      let px = 0, py = 0;
      if (typeof ContainmentEngine !== 'undefined') {
        const padding = ContainmentEngine.getRectProtectionPadding(child);
        px = padding.ChildProtectionPaddingX;
        py = padding.ChildProtectionPaddingY;
      }
      const hw = child.Width / 2;
      const hh = child.Height / 2;
      const pp = window.recalculateChildRectangleProtectionPadding(
        child.WorldX,
        child.WorldY,
        hw,
        hh,
        px,
        py
      );
      if (pp) {
        childRectBoundaries[child.ShapeID] = pp;
      } else {
        errors.push(`Failed to calculate padding for rectangle child "${child.ShapeID}"`);
      }
    }

    // 4. Recalculate child circle protection padding boundaries
    for (const child of circles) {
      const r = child.Radius ?? child.Width / 2;
      let ppVal = 0;
      if (typeof ContainmentEngine !== 'undefined') {
        ppVal = ContainmentEngine.getCircleProtectionPadding(child);
      }
      const pp = window.recalculateChildCircleProtectionPadding(
        child.WorldX,
        child.WorldY,
        r,
        ppVal
      );
      if (pp) {
        childCircleBoundaries[child.ShapeID] = pp;
      } else {
        errors.push(`Failed to calculate padding for circle child "${child.ShapeID}"`);
      }
    }

    // 5. Group siblings by immediate parent
    let siblingGroups = SiblingGroupingByImmediateParent;
    if (!siblingGroups) {
      siblingGroups = {};
      for (const child of children) {
        const pId = child.ParentContainerID;
        if (!siblingGroups[pId]) {
          siblingGroups[pId] = [];
        }
        siblingGroups[pId].push(child);
      }
    }

    return {
      ok: errors.length === 0,
      parentBoundaries,
      childRectBoundaries,
      childCircleBoundaries,
      siblingGroups,
      errors
    };
  }

  return {
    recalculateAllMultiChildContainmentProtectionPaddingGeometry
  };

})();

// Export for Node environments if loaded under test
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MultiChildContainmentProtectionPaddingRecalculation;
} else {
  window.MultiChildContainmentProtectionPaddingRecalculation = MultiChildContainmentProtectionPaddingRecalculation;
}
