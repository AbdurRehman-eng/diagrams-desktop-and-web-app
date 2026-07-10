/**
 * delete-guard.js
 * ================
 * Generic deletion guard — centralises all pre-delete validation.
 *
 * Rules (in order):
 *   1. Any shape whose ParentContainerID === shapeId is a named child → BLOCK.
 *   2. Any shape geometrically inside shapeId that has a parentType requirement → BLOCK.
 *   3. Any CircleOnContainer whose ParentContainerID === shapeId → BLOCK.
 *      (An Internet Gateway must be deleted before its host VPC, per the
 *       device-on-container-edge rules CSV.)
 *
 * Usage:
 *   const result = DeleteGuard.check(shapeId);
 *   if (!result.ok) { alert(result.reason); return; }
 *   // safe to delete
 */

'use strict';

const DeleteGuard = (() => {

  /**
   * check
   * -----
   * @param {string} shapeId  – ShapeID of the shape the user wants to delete
   * @returns {{ ok: boolean, reason: string }}
   */
  function check(shapeId) {
    const allShapes = CanvasState.getShapes();
    const shape     = allShapes.find(s => s.ShapeID === shapeId);
    if (!shape) return { ok: true, reason: '' };

    // ── Rule 1: Named parent-child link ────────────────────────────────────
    const hasNamedChild = allShapes.some(c =>
      c.ShapeID !== shapeId &&
      c.ParentContainerID === shapeId
    );
    if (hasNamedChild) {
      const label = _label(shape);
      return {
        ok:     false,
        reason: `Cannot delete "${label}" — it still contains child resources. Remove them first.`,
      };
    }

    // ── Rule 2: Geometric containment (fallback for shapes without parent link) ─
    if (typeof ShapeCategories !== 'undefined') {
      const hw = shape.Width  / 2;
      const hh = shape.Height / 2;
      const hasGeometricChild = allShapes.some(c => {
        if (c.ShapeID === shapeId) return false;
        const def = ShapeCategories.getItemByType(c.Type);
        // Only block if the candidate IS a child-type shape (has a required parent)
        if (!def || def.parentType === null || def.parentType === undefined) return false;
        return (
          c.WorldX >= shape.WorldX - hw &&
          c.WorldX <= shape.WorldX + hw &&
          c.WorldY >= shape.WorldY - hh &&
          c.WorldY <= shape.WorldY + hh
        );
      });
      if (hasGeometricChild) {
        const label = _label(shape);
        return {
          ok:     false,
          reason: `Cannot delete "${label}" — it still contains child resources. Remove them first.`,
        };
      }
    }

    // ── Rule 3: Device-on-container-edge (COC / Internet Gateway) ──────────
    // Per device-on-container-edge-rules.csv: the COC must be deleted before
    // its host container can be deleted.
    if (typeof CanvasState !== 'undefined' &&
        typeof CanvasState.getCircleOnContainers === 'function') {
      const attachedCoc = CanvasState.getCircleOnContainers().find(c =>
        c.ParentContainerID === shapeId
      );
      if (attachedCoc) {
        const label    = _label(shape);
        const cocLabel = attachedCoc.Label || attachedCoc.DeviceOnContainerEdgeType || 'Edge Device';
        return {
          ok:     false,
          reason: `Cannot delete "${label}" — it has a "${cocLabel}" attached to its edge. Delete the edge device first.`,
        };
      }
    }

    return { ok: true, reason: '' };
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  function _label(shape) {
    if (typeof ShapeCategories !== 'undefined') {
      const def = ShapeCategories.getItemByType(shape.Type);
      if (def?.label) return def.label;
    }
    return shape.Label || shape.Type || 'This shape';
  }

  return { check };

})();
