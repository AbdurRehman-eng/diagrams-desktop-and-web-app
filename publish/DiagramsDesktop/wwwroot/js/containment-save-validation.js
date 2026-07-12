/**
 * containment-save-validation.js
 * ================================
 * Milestone 9 — Phase 9.7
 * Verifies the committed parent-child containment state is valid before persistence.
 */

'use strict';

const ContainmentSaveValidation = (() => {

  console.log('[ContainmentSaveValidation] MODULE LOADED - Version M9.7');

  /**
   * validate
   * Runs full recalculation and validation before save.
   * @returns {{ ok: boolean, errors: string[] }}
   */
  function validate() {
    const allShapes = CanvasState.getShapes();
    return ContainmentProtectionPaddingRecalculation.recalculateAll(allShapes);
  }

  return { validate };

})();
