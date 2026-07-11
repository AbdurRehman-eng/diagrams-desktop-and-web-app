/**
 * parent-drop-validator.js
 * ========================
 * Milestone 4 — Strict hierarchical drop validation for cloud shapes.
 *
 * Rule:
 *   A shape can only be dropped on the canvas IF:
 *   1. Its parentType is null  → allowed at canvas root (no shape underneath).
 *   2. Its parentType = X      → there must be a shape of type X at the
 *      drop world-position that fully contains the drop point.
 *
 * All geometry checks are in World Space.
 * No DOM access — pure logic module.
 *
 * API:
 *   validate(itemDef, worldX, worldY, excludeShapeId?, childDims?) → { ok: bool, reason: string|null }
 *
 *   childDims (optional): { childWidth, childHeight }
 *     When supplied, the check upgrades from a center-point test to a full
 *     bounding-box containment test — the child's entire rectangle must fit
 *     inside the parent. Used by the move validator in drag-handler_v2.js.
 */

'use strict';

const ParentDropValidator = (() => {

  /**
   * validate
   * ─────────
   * @param {object}  itemDef      - Shape item definition from ShapeCategories
   * @param {number}  worldX       - Center X in World Space
   * @param {number}  worldY       - Center Y in World Space
   * @param {string}  [excludeShapeId] - ShapeID to ignore (self-exclusion during moves)
   * @param {object}  [childDims]  - { childWidth, childHeight } for bounding-box check
   * @returns {{ ok: boolean, reason: string|null }}
   */
  function validate(itemDef, worldX, worldY, excludeShapeId = null, childDims = null) {
    if (!itemDef) return { ok: false, reason: 'Unknown shape type.' };

    // Placeholder shapes cannot be dropped
    if (itemDef.isPlaceholder) {
      return { ok: false, reason: `"${itemDef.label}" is a Coming Soon placeholder and cannot be placed on the canvas.` };
    }

    const parentType = itemDef.parentType;

    // ── Root-level shape: no parent required ──────────────────────
    if (parentType === null || parentType === undefined) {
      // Optionally check it's not dropped on top of another shape of the same type
      const overlapping = _shapesAt(worldX, worldY, excludeShapeId);
      const conflict = overlapping.find(s => s.Type === itemDef.type);
      if (conflict) {
        return { ok: false, reason: `Cannot overlap two "${itemDef.label}" shapes.` };
      }
      return { ok: true, reason: null };
    }

    // ── Child shape: must be dropped inside its required parent ───
    let shapes = CanvasState.getShapes();
    if (excludeShapeId) {
      shapes = shapes.filter(s => s.ShapeID !== excludeShapeId);
    }
    const requiredTypes = Array.isArray(parentType) ? parentType : [parentType];

    // Find ALL shapes containing the drop point/box, sorted by area (smallest first)
    // Smallest area = innermost shape.
    // When childDims are supplied use the strict bounding-box test so that a
    // shape whose CENTER is inside but whose EDGES bleed outside is rejected.
    const _containsChild = childDims
      ? (s) => _boxFullyInsideShape(worldX, worldY, childDims.childWidth / 2, childDims.childHeight / 2, s)
      : (s) => _pointInsideShape(worldX, worldY, s);

    const overlapping = shapes
      .filter(_containsChild)
      .sort((a, b) => (a.Width * a.Height) - (b.Width * b.Height));

    if (overlapping.length === 0) {
       const parentLabels = requiredTypes.map(t => {
        const pDef = ShapeCategories.getItemByType(t);
        return pDef ? `"${pDef.label}"` : `"${t}"`;
      }).join(' or ');

      return {
        ok: false,
        reason: `"${itemDef.label}" must be placed inside a ${parentLabels}.`,
      };
    }

    // The immediate parent is the smallest shape at this point
    const immediateParent = overlapping[0];

    // Check if the immediate parent is of a valid type
    if (!requiredTypes.includes(immediateParent.Type)) {
      const parentLabels = requiredTypes.map(t => {
        const pDef = ShapeCategories.getItemByType(t);
        return pDef ? `"${pDef.label}"` : `"${t}"`;
      }).join(' or ');

      return {
        ok: false,
        reason: `"${itemDef.label}" cannot be placed inside a "${immediateParent.Label}". It must be placed inside a ${parentLabels}.`,
      };
    }

    return { ok: true, reason: null };
  }

  // ── Geometry helpers ──────────────────────────────────────────────────────

  /**
   * Returns all shapes whose bounding box contains the given world point.
   */
  function _shapesAt(wx, wy, excludeShapeId = null) {
    let shapes = CanvasState.getShapes();
    if (excludeShapeId) {
      shapes = shapes.filter(s => s.ShapeID !== excludeShapeId);
    }
    return shapes.filter(s => _pointInsideShape(wx, wy, s));
  }

  /**
   * _pointInsideShape
   * Center-point containment test (World Space, AABB).
   * Used for initial drop placement where only a point is known.
   */
  function _pointInsideShape(wx, wy, shape) {
    const hw = shape.Width  / 2;
    const hh = shape.Height / 2;
    return (
      wx >= shape.WorldX - hw && wx <= shape.WorldX + hw &&
      wy >= shape.WorldY - hh && wy <= shape.WorldY + hh
    );
  }

  /**
   * _boxFullyInsideShape
   * Strict bounding-box containment test (World Space, AABB).
   * ALL four edges of the child must lie within the parent's bounding box.
   * Used for move/resize validation where we know the child's dimensions.
   *
   * @param {number} cx     - Child center X
   * @param {number} cy     - Child center Y
   * @param {number} chw    - Child half-width
   * @param {number} chh    - Child half-height
   * @param {object} parent - Parent shape (WorldX, WorldY, Width, Height)
   */
  function _boxFullyInsideShape(cx, cy, chw, chh, parent) {
    const phw = parent.Width  / 2;
    const phh = parent.Height / 2;
    return (
      cx - chw >= parent.WorldX - phw &&
      cx + chw <= parent.WorldX + phw &&
      cy - chh >= parent.WorldY - phh &&
      cy + chh <= parent.WorldY + phh
    );
  }

  return { validate };

})();
