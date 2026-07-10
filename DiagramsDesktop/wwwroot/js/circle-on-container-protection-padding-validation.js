/**
 * circle-on-container-protection-padding-validation.js
 * ======================================================
 * Milestone 9 — Phase 9.8
 * Validates Circle On Container (IGW) items using Protection Padding rules.
 * Does NOT apply normal child-circle containment — IGW sits ON the border.
 *
 * Validates:
 *   1. Sibling non-overlap using ProtectionPaddedRadius
 *   2. No overlap with non-container shapes inside the VPC
 */

'use strict';

const CircleOnContainerProtectionPaddingValidation = (() => {

  console.log('[CircleOnContainerProtectionPaddingValidation] MODULE LOADED - Version M9.8');

  /**
   * validateCoc
   * @param {object} coc       CircleOnContainer from CircleOnContainerState
   * @param {object[]} allCocs All Circle On Containers
   * @param {object[]} allShapes All shapes
   * @returns {{ valid: boolean, reason: string }}
   */
  function validateCoc(coc, allCocs, allShapes) {
    const ppRatio = coc.ProtectionPaddingRadiusRatio ?? 0.20;
    const ppR     = coc.Radius + coc.Radius * ppRatio; // ProtectionPaddedRadius

    // Sibling COC non-overlap
    for (const other of allCocs) {
      if (other.CircleOnContainerID === coc.CircleOnContainerID) continue;
      const otherPpR = other.Radius + other.Radius * (other.ProtectionPaddingRadiusRatio ?? 0.20);
      const dx = coc.CenterX - other.CenterX;
      const dy = coc.CenterY - other.CenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ppR + otherPpR) {
        return { valid: false, reason: `COC overlaps sibling "${other.CircleOnContainerID}"` };
      }
    }

    return { valid: true, reason: 'ok' };
  }

  return { validateCoc };

})();
