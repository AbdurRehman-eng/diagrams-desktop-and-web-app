/**
 * circle-on-container-radius-range-validation.js
 * ================================================
 * Milestone 9 — Phase 9.8
 * When the parent container (VPC) is resized, validates that the existing
 * COC Radius still falls within the recomputed min/max range for the active edge.
 *
 * Rule: COC Radius does NOT automatically change on parent resize.
 * The parent resize is only valid if [Radius >= minR AND Radius <= maxR].
 */

'use strict';

const CircleOnContainerRadiusRangeValidation = (() => {

  console.log('[CircleOnContainerRadiusRangeValidation] MODULE LOADED - Version M9.8');

  /**
   * validateOnParentResize
   * @param {object} coc          CircleOnContainer
   * @param {object} newParentShape  Parent shape after candidate resize
   * @returns {{ valid: boolean, reason: string }}
   */
  function validateOnParentResize(coc, newParentShape) {
    const gv = CanvasState.getGlobalVars()?.circleOnContainer ?? {};
    const minRatio = gv.minimumRadiusRatio ?? 0.10;
    const maxRatio = gv.maximumRadiusRatio ?? 0.20;

    const edgeLen = _edgeLength(newParentShape, coc.HostEdge);
    const minR = edgeLen * minRatio;
    const maxR = edgeLen * maxRatio;

    if (coc.Radius < minR) {
      return { valid: false, reason: `COC Radius ${coc.Radius.toFixed(1)} < min ${minR.toFixed(1)} for new edge length` };
    }
    if (coc.Radius > maxR) {
      return { valid: false, reason: `COC Radius ${coc.Radius.toFixed(1)} > max ${maxR.toFixed(1)} for new edge length` };
    }
    return { valid: true, reason: 'ok' };
  }

  function _edgeLength(shape, hostEdge) {
    if (hostEdge === 'Top' || hostEdge === 'Bottom') return shape.Width;
    return shape.Height;
  }

  return { validateOnParentResize };

})();
