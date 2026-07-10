/**
 * parent-child-reference-center.js
 * ===================================
 * Milestone 9 — Phase 9.3 & 9.6
 * Moves all child items with their parent rectangle container,
 * preserving the stored child-parent reference-center offset.
 *
 * Reference-center equations (Milestone 9 document, Rule 4):
 *   ChildParentOffsetX = ChildCenterX - ParentCenterX
 *   ChildParentOffsetY = ChildCenterY - ParentCenterY
 *
 *   NewChildCenterX = NewParentCenterX + ChildParentOffsetX
 *   NewChildCenterY = NewParentCenterY + ChildParentOffsetY
 *
 * BUG-FIX: The recursive call previously passed child.WorldX/Y AFTER
 * CanvasState.updateShape had mutated them (in-place via Object.assign),
 * so the delta was always 0 and grandchildren never moved.
 * Fix: capture OldChildCenterX/Y BEFORE calling updateShape.
 */

'use strict';

const ParentChildReferenceCenter = (() => {

  console.log('[ParentChildReferenceCenter] MODULE LOADED - Version M9.3.1');

  /**
   * computeOffset
   * Returns the reference-center offset of a child relative to its parent.
   */
  function computeOffset(childCenterX, childCenterY, parentCenterX, parentCenterY) {
    return {
      ChildParentOffsetX: childCenterX - parentCenterX,
      ChildParentOffsetY: childCenterY - parentCenterY,
    };
  }

  /**
   * moveChildrenWithParent
   * Recursively translates all children (and their descendants) by the same
   * delta as the parent, preserving the reference-center offset.
   *
   * @param {string}   parentShapeId
   * @param {number}   NewParentCenterX  New parent center after move
   * @param {number}   NewParentCenterY
   * @param {number}   OldParentCenterX  Parent center before move
   * @param {number}   OldParentCenterY
   * @param {object[]} allShapes         All shapes from CanvasState (live reference)
   */
  function moveChildrenWithParent(
    parentShapeId,
    NewParentCenterX, NewParentCenterY,
    OldParentCenterX, OldParentCenterY,
    allShapes
  ) {
    // M9 Rule 4 — compute delta from parent move
    const ParentMoveDeltaX = NewParentCenterX - OldParentCenterX;
    const ParentMoveDeltaY = NewParentCenterY - OldParentCenterY;

    if (ParentMoveDeltaX === 0 && ParentMoveDeltaY === 0) return;

    // Only direct children of this parent (N-1 guarantee: excludes self)
    const children = allShapes.filter(s => s.ParentContainerID === parentShapeId);

    for (const child of children) {
      // BUG-FIX: capture OLD position BEFORE mutation
      const OldChildCenterX = child.WorldX;
      const OldChildCenterY = child.WorldY;

      // M9 Rule 4 equations — verbatim:
      //   ChildParentOffsetX = OldChildCenterX - OldParentCenterX  (preserved implicitly via delta)
      //   NewChildCenterX    = NewParentCenterX + ChildParentOffsetX
      //                      = NewParentCenterX + (OldChildCenterX - OldParentCenterX)
      //                      = OldChildCenterX + (NewParentCenterX - OldParentCenterX)
      //                      = OldChildCenterX + ParentMoveDeltaX
      const NewChildCenterX = OldChildCenterX + ParentMoveDeltaX;
      const NewChildCenterY = OldChildCenterY + ParentMoveDeltaY;

      CanvasState.updateShape(child.ShapeID, {
        WorldX: NewChildCenterX,
        WorldY: NewChildCenterY,
      });

      // Recurse: pass OldChildCenterX/Y captured BEFORE mutation
      moveChildrenWithParent(
        child.ShapeID,
        NewChildCenterX, NewChildCenterY,
        OldChildCenterX, OldChildCenterY,  // ← correct: pre-mutation values
        allShapes
      );
    }
  }

  return { computeOffset, moveChildrenWithParent };

})();
