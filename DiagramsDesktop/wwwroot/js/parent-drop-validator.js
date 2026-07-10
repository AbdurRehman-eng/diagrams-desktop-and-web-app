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
 *   validate(itemDef, worldX, worldY) → { ok: bool, reason: string|null }
 */

'use strict';

const ParentDropValidator = (() => {

  /**
   * validate
   * ─────────
   * @param {object} itemDef   - Shape item definition from ShapeCategories
   * @param {number} worldX    - Drop X in World Space
   * @param {number} worldY    - Drop Y in World Space
   * @returns {{ ok: boolean, reason: string|null }}
   */
  function validate(itemDef, worldX, worldY) {
    if (!itemDef) return { ok: false, reason: 'Unknown shape type.' };

    // Placeholder shapes cannot be dropped
    if (itemDef.isPlaceholder) {
      return { ok: false, reason: `"${itemDef.label}" is a Coming Soon placeholder and cannot be placed on the canvas.` };
    }

    const parentType = itemDef.parentType;

    // ── Root-level shape: no parent required ──────────────────────
    if (parentType === null || parentType === undefined) {
      // Optionally check it's not dropped on top of another shape of the same type
      const overlapping = _shapesAt(worldX, worldY);
      const conflict = overlapping.find(s => s.Type === itemDef.type);
      if (conflict) {
        return { ok: false, reason: `Cannot overlap two "${itemDef.label}" shapes.` };
      }
      return { ok: true, reason: null };
    }

    // ── Child shape: must be dropped inside its required parent ───
    const shapes = CanvasState.getShapes();
    const requiredTypes = Array.isArray(parentType) ? parentType : [parentType];

    // Find ALL shapes containing the drop point, sorted by area (smallest first)
    // Smallest area = innermost shape
    const overlapping = shapes
      .filter(s => _pointInsideShape(worldX, worldY, s))
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
  function _shapesAt(wx, wy) {
    return CanvasState.getShapes().filter(s => _pointInsideShape(wx, wy, s));
  }

  /**
   * Axis-aligned bounding-box containment test (World Space).
   * Works for both rectangles and circle/ellipse shapes via bounding box.
   */
  function _pointInsideShape(wx, wy, shape) {
    const hw = shape.Width  / 2;
    const hh = shape.Height / 2;
    return (
      wx >= shape.WorldX - hw && wx <= shape.WorldX + hw &&
      wy >= shape.WorldY - hh && wy <= shape.WorldY + hh
    );
  }

  return { validate };

})();
