/**
 * validate-edge-circle-placement.js
 * ==================================
 * Milestone 8 — Validates a candidate Circle On Container position.
 *
 * Checks:
 * 1. Center is on the declared edge (within epsilon).
 * 2. ProtectionPaddedRadius does not overlap siblings on the same parent.
 */

'use strict';

const ValidateEdgeCirclePlacement = (() => {

  const EPSILON = 0.5; // world units

  /**
   * validate
   * --------
   * @param {object} candidate
   *   { CenterX, CenterY, HostEdge, EdgeParameterT, Radius,
   *     ProtectionPaddingRadiusRatio, CircleOnContainerID, ParentContainerID }
   * @param {object} parentShape  - the host container shape
   * @returns {{ ok: boolean, reason?: string }}
   */
  function validate(candidate, parentShape) {
    // M9: Max device count check (e.g. max 1 IGW per VPC)
    if (typeof EdgeAttachmentRulesLoader !== 'undefined') {
      const maxDevices = EdgeAttachmentRulesLoader.getMaxDevices(
        candidate.DeviceOnContainerEdgeType,
        parentShape.Type
      );
      if (maxDevices !== null) {
        const existingCount = CanvasState.getCircleOnContainers().filter(c =>
          c.ParentContainerID === candidate.ParentContainerID &&
          c.DeviceOnContainerEdgeType === candidate.DeviceOnContainerEdgeType &&
          c.CircleOnContainerID !== candidate.CircleOnContainerID
        ).length;
        if (existingCount >= maxDevices) {
          return { ok: false, reason: `Maximum ${maxDevices} "${candidate.DeviceOnContainerEdgeType}" allowed on this container.` };
        }
      }
    }

    // Sibling COC (other gateway) overlap check
    const siblingCheck = _checkSiblingNonOverlap(candidate);
    if (!siblingCheck.ok) return siblingCheck;

    // ── M9 Equation: COC must not overlap any shape that is NOT its parent ──
    // The IGW sits on the parent's edge (straddling in/out). Its full circle
    // must not intersect the bounds of any sibling shape (e.g. Availability Zone).
    // This enforces the protection-padding boundary equations at every drag tick.
    if (typeof Collision !== 'undefined' && typeof CanvasState !== 'undefined') {
      const cocCircle = { type: 'circle', cx: candidate.CenterX, cy: candidate.CenterY, r: candidate.Radius };
      const allShapes = CanvasState.getShapes();

      const ancestorIds = new Set();
      let currParentId = candidate.ParentContainerID;
      while (currParentId) {
        ancestorIds.add(currParentId);
        const pShape = allShapes.find(s => s.ShapeID === currParentId);
        currParentId = pShape ? pShape.ParentContainerID : null;
      }

      for (const shape of allShapes) {
        // Never check against own parent container or parent's ancestor containers
        if (ancestorIds.has(shape.ShapeID)) continue;

        const geom = (shape.GeometryType || shape.Type || '').toLowerCase();
        let shapeObj;
        if (geom === 'circle' || geom === 'ellipse') {
          shapeObj = { type: 'circle', cx: shape.WorldX, cy: shape.WorldY, r: shape.Radius ?? shape.Width / 2 };
        } else {
          shapeObj = { type: 'rectangle', x: shape.WorldX - shape.Width / 2, y: shape.WorldY - shape.Height / 2, width: shape.Width, height: shape.Height };
        }

        if (Collision.checkCollision(cocCircle, shapeObj)) {
          return { ok: false, reason: `Overlaps shape "${shape.Label || shape.Type}"` };
        }
      }
    }

    return { ok: true };
  }

  /**
   * validateRadiusRange
   * -------------------
   * Returns { ok, reason, clampedRadius } where clampedRadius is the
   * closest valid radius if the candidate is out of range.
   */
  function validateRadiusRange(candidateRadius, parentShape, hostEdge) {
    const gv = CanvasState.getGlobalVars()?.circleOnContainer ?? {};
    const minRatio = gv.minimumRadiusRatio ?? 0.10;
    const maxRatio = gv.maximumRadiusRatio ?? 0.20;

    const edgeLen = CalculateEdgeCircleCenter.getEdgeLength(parentShape, hostEdge);
    const minR = edgeLen * minRatio;
    const maxR = edgeLen * maxRatio;

    if (candidateRadius < minR) {
      return { ok: false, reason: `Radius below minimum (${minR.toFixed(1)})`, clampedRadius: minR };
    }
    if (candidateRadius > maxR) {
      return { ok: false, reason: `Radius above maximum (${maxR.toFixed(1)})`, clampedRadius: maxR };
    }
    return { ok: true, clampedRadius: candidateRadius };
  }

  // ── Private ─────────────────────────────────────────────────────

  function _checkEdgeAttachment(candidate, parentShape) {
    const b = CalculateEdgeCircleCenter.getBounds(parentShape);
    const { CenterX, CenterY, HostEdge } = candidate;

    switch (HostEdge) {
      case 'Top':
        if (Math.abs(CenterY - b.Top) > EPSILON)
          return { ok: false, reason: 'Center not on Top edge' };
        if (CenterX < b.Left - EPSILON || CenterX > b.Right + EPSILON)
          return { ok: false, reason: 'Center outside Top edge range' };
        break;
      case 'Right':
        if (Math.abs(CenterX - b.Right) > EPSILON)
          return { ok: false, reason: 'Center not on Right edge' };
        if (CenterY < b.Bottom - EPSILON || CenterY > b.Top + EPSILON)
          return { ok: false, reason: 'Center outside Right edge range' };
        break;
      case 'Bottom':
        if (Math.abs(CenterY - b.Bottom) > EPSILON)
          return { ok: false, reason: 'Center not on Bottom edge' };
        if (CenterX < b.Left - EPSILON || CenterX > b.Right + EPSILON)
          return { ok: false, reason: 'Center outside Bottom edge range' };
        break;
      case 'Left':
        if (Math.abs(CenterX - b.Left) > EPSILON)
          return { ok: false, reason: 'Center not on Left edge' };
        if (CenterY < b.Bottom - EPSILON || CenterY > b.Top + EPSILON)
          return { ok: false, reason: 'Center outside Left edge range' };
        break;
    }
    return { ok: true };
  }

  function _checkSiblingNonOverlap(candidate) {
    const siblings = CanvasState.getCircleOnContainers().filter(c =>
      c.ParentContainerID === candidate.ParentContainerID &&
      c.CircleOnContainerID !== candidate.CircleOnContainerID
    );

    const pr1 = candidate.Radius * (candidate.ProtectionPaddingRadiusRatio ?? 0.2);
    const pr1Total = candidate.Radius + pr1;

    for (const sib of siblings) {
      const pr2 = sib.Radius * (sib.ProtectionPaddingRadiusRatio ?? 0.2);
      const pr2Total = sib.Radius + pr2;

      const dx = candidate.CenterX - sib.CenterX;
      const dy = candidate.CenterY - sib.CenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < pr1Total + pr2Total) {
        return { ok: false, reason: 'Overlaps sibling Circle On Container' };
      }
    }
    return { ok: true };
  }

  return { validate, validateRadiusRange };

})();
