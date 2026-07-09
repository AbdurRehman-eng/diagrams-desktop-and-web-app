/**
 * toggle-shapes-panel.js
 * =======================
 * Responsibility: Toggle the ShapesPanel between expanded
 * and collapsed states. Updates the DOM, state, and any
 * related visual layout concerns.
 *
 * Phase Coverage: 1.1
 *
 * Contract Structure:
 *   Trigger / Input / Validation / Processing / Output /
 *   State Change / Next Possible Call / Error
 */

'use strict';

const ToggleShapesPanel = (() => {

  /**
   * toggleShapesPanel
   * ──────────────────
   * Trigger:     click on #ShapesPanelToggleButton
   * Input:       none (reads current IsShapesPanelCollapsed from state)
   * Validation:  Panel element must exist in DOM
   * Processing:  Flips IsShapesPanelCollapsed;
   *              toggles 'collapsed' CSS class on #ShapesPanel;
   *              updates aria-expanded on toggle button;
   *              after expand: restores splitter layout
   * Output:      Panel expanded or collapsed visually
   * State Change: IsShapesPanelCollapsed flipped
   * Next Call:   updateShapesPanelLayout (on expand)
   * Error:       Preserves previous valid state if panel element is missing
   */
  function toggleShapesPanel() {
    const panel     = document.getElementById('ShapesPanel');
    const toggleBtn = document.getElementById('ShapesPanelToggleButton');

    if (!panel) {
      console.error('[TogglePanel] toggleShapesPanel: panel element not found');
      return;
    }

    const isCollapsed = ShapesPanelState.get('IsShapesPanelCollapsed');
    const newState    = !isCollapsed;

    // ── Update state ──────────────────────────────────────────
    ShapesPanelState.set('IsShapesPanelCollapsed', newState);

    // ── Update DOM ────────────────────────────────────────────
    panel.classList.toggle('collapsed', newState);

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', String(!newState));
      toggleBtn.title = newState ? 'Expand Shapes Panel' : 'Collapse Shapes Panel';
    }

    // ── Post-expand: refresh layout ───────────────────────────
    if (!newState) {
      // Small delay so CSS transition finishes before measuring
      setTimeout(() => {
        ShapesPanelSplitter.updateShapesPanelLayout();
      }, 50);
    }

    // ── Status bar update ─────────────────────────────────────
    const statusMsg = document.getElementById('status-message');
    if (statusMsg) {
      statusMsg.textContent = newState ? 'Shapes Panel collapsed' : 'Shapes Panel expanded';
      setTimeout(() => { if (statusMsg) statusMsg.textContent = 'Ready'; }, 2000);
    }
  }

  /**
   * attachToggleListener
   * ─────────────────────
   * Trigger:     Panel mount (_attachAllListeners in render-shapes-panel.js)
   * Processing:  Wires click event on #ShapesPanelToggleButton to toggleShapesPanel
   */
  function attachToggleListener() {
    const toggleBtn = document.getElementById('ShapesPanelToggleButton');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggleShapesPanel);
    }
  }

  return {
    toggleShapesPanel,
    attachToggleListener,
  };

})();
