/**
 * containment-engine.js
 * ======================
 * Milestone 9 — Core integration module.
 *
 * Orchestrates all Protection Padding math for drag-handler_v2.js:
 *   - Live clamping during drag (phase 9.1 / 9.4)
 *   - Sibling overlap checking (N-1 guarantee)
 *   - Parent resize rejection (phase 9.3 / 9.6)
 *   - Child containment validation on mouse-up
 *
 * N-1 GUARANTEE:
 *   getSiblings(shapeId, allShapes) returns only siblings sharing the same
 *   ParentContainerID, explicitly excluding the shape itself.
 *   The collision loop therefore runs exactly (N-1) times.
 *
 * Protection Padding Ratios:
 *   Rectangle: from CanvasState.getGlobalVars().rectangle.protectionPaddingRatio
 *   Circle:    from CanvasState.getGlobalVars().circle.protectionPaddingRatio
 */

'use strict';

const ContainmentEngine = (() => {

  console.log('[ContainmentEngine] MODULE LOADED - Version M9.1');

  const EPSILON = 0.5;

  // ── Public: Parent inner boundaries ──────────────────────────────────────

  function getParentShape(childShape, allShapes) {
    if (!childShape?.ParentContainerID) return null;
    return allShapes.find(s => s.ShapeID === childShape.ParentContainerID) || null;
  }

  function getParentInnerBoundaries(parentShape) {
    if (!parentShape) return null;
    return DeriveParentInnerBoundaries.fromShape(parentShape);
  }

  // ── Public: Protection Padding values ────────────────────────────────────

  function getRectProtectionPadding(shape) {
    const gv    = CanvasState.getGlobalVars();
    const ratio = gv.rectangle?.protectionPaddingRatio ?? 0.10;
    return {
      ChildProtectionPaddingX: (shape.Width  / 2) * ratio,
      ChildProtectionPaddingY: (shape.Height / 2) * ratio,
    };
  }

  function getCircleProtectionPadding(shape) {
    const gv    = CanvasState.getGlobalVars();
    const ratio = gv.circle?.protectionPaddingRatio ?? 0.10;
    const r     = shape.Radius ?? shape.Width / 2;
    return r * ratio;
  }

  // ── Public: Live clamp during drag ───────────────────────────────────────

  /**
   * clampChildRect
   * Clamps a candidate (tx, ty) rectangle center to stay inside parent.
   * Returns { x, y } clamped center.
   */
  function clampChildRect(tx, ty, childShape, parentShape) {
    const bounds = DeriveParentInnerBoundaries.fromShape(parentShape);
    if (!bounds) return { x: tx, y: ty };
    const { ChildProtectionPaddingX, ChildProtectionPaddingY } = getRectProtectionPadding(childShape);
    const hw = childShape.Width  / 2;
    const hh = childShape.Height / 2;
    const clamped = clampChildRectangleCenterWithinParent(
      tx, ty,
      bounds.ParentInnerLeftX, bounds.ParentInnerRightX,
      bounds.ParentInnerTopY,  bounds.ParentInnerBottomY,
      hw, hh,
      ChildProtectionPaddingX, ChildProtectionPaddingY,
      EPSILON
    );
    return { x: clamped.ClampedChildCenterX, y: clamped.ClampedChildCenterY };
  }

  /**
   * clampChildCircle
   * Clamps a candidate (tx, ty) circle center to stay inside parent.
   * Returns { x, y } clamped center.
   */
  function clampChildCircle(tx, ty, childShape, parentShape) {
    const bounds = DeriveParentInnerBoundaries.fromShape(parentShape);
    if (!bounds) return { x: tx, y: ty };
    const r  = childShape.Radius ?? childShape.Width / 2;
    const pp = getCircleProtectionPadding(childShape);
    const ppR = r + pp;
    const clamped = clampChildCircleCenterWithinParent(
      tx, ty,
      bounds.ParentInnerLeftX, bounds.ParentInnerRightX,
      bounds.ParentInnerTopY,  bounds.ParentInnerBottomY,
      ppR, EPSILON
    );
    return { x: clamped.ClampedChildCircleCenterX, y: clamped.ClampedChildCircleCenterY };
  }

  // ── Public: Validation on mouse-up ───────────────────────────────────────

  /**
   * validateChildInParent
   * Validates that the child shape is still fully within its parent after a move.
   * Returns { valid, reason }.
   */
  function validateChildInParent(childShape, parentShape) {
    if (!parentShape) return { valid: true, reason: 'no parent' };
    const bounds = DeriveParentInnerBoundaries.fromShape(parentShape);
    const geom = (childShape.GeometryType || childShape.Type || '').toLowerCase();
    const isCircle = geom === 'circle' || geom === 'ellipse';

    if (isCircle) {
      const r   = childShape.Radius ?? childShape.Width / 2;
      const pp  = getCircleProtectionPadding(childShape);
      const ppR = r + pp;
      const ppResult = recalculateChildCircleProtectionPadding(
        childShape.WorldX, childShape.WorldY, r, pp
      );
      if (!ppResult) return { valid: false, reason: 'Circle padding calc failed' };
      if (ppResult.ChildProtectionLeftX   <= bounds.ParentInnerLeftX   + EPSILON) return { valid: false, reason: 'Exceeds left'   };
      if (ppResult.ChildProtectionRightX  >= bounds.ParentInnerRightX  - EPSILON) return { valid: false, reason: 'Exceeds right'  };
      if (ppResult.ChildProtectionTopY    >= bounds.ParentInnerTopY    - EPSILON) return { valid: false, reason: 'Exceeds top'    };
      if (ppResult.ChildProtectionBottomY <= bounds.ParentInnerBottomY + EPSILON) return { valid: false, reason: 'Exceeds bottom' };
    } else {
      const { ChildProtectionPaddingX, ChildProtectionPaddingY } = getRectProtectionPadding(childShape);
      const hw = childShape.Width  / 2;
      const hh = childShape.Height / 2;
      const ppResult = recalculateChildRectangleProtectionPadding(
        childShape.WorldX, childShape.WorldY, hw, hh,
        ChildProtectionPaddingX, ChildProtectionPaddingY
      );
      if (!ppResult) return { valid: false, reason: 'Rect padding calc failed' };
      if (ppResult.ChildProtectionLeftX   <= bounds.ParentInnerLeftX   + EPSILON) return { valid: false, reason: 'Exceeds left'   };
      if (ppResult.ChildProtectionRightX  >= bounds.ParentInnerRightX  - EPSILON) return { valid: false, reason: 'Exceeds right'  };
      if (ppResult.ChildProtectionTopY    >= bounds.ParentInnerTopY    - EPSILON) return { valid: false, reason: 'Exceeds top'    };
      if (ppResult.ChildProtectionBottomY <= bounds.ParentInnerBottomY + EPSILON) return { valid: false, reason: 'Exceeds bottom' };
    }
    return { valid: true, reason: 'ok' };
  }

  // ── Public: N-1 sibling checks ───────────────────────────────────────────

  /**
   * getSiblings
   * Returns all shapes sharing the same ParentContainerID, EXCLUDING the shape itself.
   * This guarantees exactly N-1 comparisons in the sibling overlap loop.
   */
  function getSiblings(shapeId, allShapes) {
    const self = allShapes.find(s => s.ShapeID === shapeId);
    if (!self) return [];
    // N-1: explicitly exclude self
    const parentId = self.ParentContainerID || '';
    return allShapes.filter(s =>
      (s.ParentContainerID || '') === parentId &&
      s.ShapeID !== shapeId                          // ← the -1
    );
  }

  /**
   * checkSiblingOverlap
   * Checks if `shape` overlaps any of its N-1 siblings using Protection Padding.
   * Returns { collided: boolean, siblingId: string|null }.
   */
  function checkSiblingOverlap(shape, siblings) {
    const aObj = _paddedObj(shape);
    for (const sib of siblings) {
      const bObj = _paddedObj(sib);
      if (Collision.checkCollision(aObj, bObj)) {
        return { collided: true, siblingId: sib.ShapeID };
      }
    }
    return { collided: false, siblingId: null };
  }

  // ── Public: Parent resize validation ─────────────────────────────────────

  /**
   * validateParentResize
   * Validates that a candidate parent resize does not leave any child outside.
   */
  function validateParentResize(candidateBounds, parentShapeId, allShapes) {
    return ParentRectangleResizeValidation.validate(candidateBounds, parentShapeId, allShapes);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  function _paddedObj(shape) {
    const geom = (shape.GeometryType || shape.Type || '').toLowerCase();
    const isCircle = geom === 'circle' || geom === 'ellipse';
    if (isCircle) {
      const r  = shape.Radius ?? shape.Width / 2;
      const pp = getCircleProtectionPadding(shape);
      return { type: 'circle', cx: shape.WorldX, cy: shape.WorldY, r: r + pp };
    }
    const { ChildProtectionPaddingX: px, ChildProtectionPaddingY: py } = getRectProtectionPadding(shape);
    const hw = shape.Width  / 2 + px;
    const hh = shape.Height / 2 + py;
    return { type: 'rectangle',
             x: shape.WorldX - hw, y: shape.WorldY - hh,
             width: hw * 2, height: hh * 2 };
  }

  return {
    getParentShape,
    getParentInnerBoundaries,
    clampChildRect,
    clampChildCircle,
    validateChildInParent,
    getSiblings,
    checkSiblingOverlap,
    validateParentResize,
    getRectProtectionPadding,
    getCircleProtectionPadding,
  };

})();
