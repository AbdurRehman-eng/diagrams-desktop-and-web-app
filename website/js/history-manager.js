/**
 * history-manager.js
 * ==================
 * Version M8.1 — Snapshot-based Undo/Redo Engine
 *
 * M8.1 fix: Snapshots now include BOTH Shapes AND CircleOnContainers (IGW/COC).
 * Previously only Shapes were saved, so any undo wiped all IGW placements.
 */

'use strict';

const HistoryManager = (() => {

  const MAX_HISTORY = 50;
  let undoStack = [];
  let redoStack = [];

  function init() {
    clear();
    console.log('[HistoryManager] Initialized. Version M8.1');
  }

  function clear() {
    undoStack = [];
    redoStack = [];
    updateButtons();
  }

  /**
   * recordState
   * -----------
   * Deep-clones the current Shapes + CircleOnContainers into a snapshot object.
   */
  function recordState() {
    const snapshot = {
      shapes: JSON.parse(JSON.stringify(CanvasState.getShapes())),
      cocs:   JSON.parse(JSON.stringify(CanvasState.getCircleOnContainers())),
    };

    undoStack.push(snapshot);
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }

    // Any new explicit action drops the redo future
    redoStack = [];
    updateButtons();
  }

  function undo() {
    // Need at least genesis state + 1 action
    if (undoStack.length <= 1) return;

    // Pop current state to Redo
    const current = undoStack.pop();
    redoStack.push(current);

    // Apply the previous state
    const previous = undoStack[undoStack.length - 1];
    _applySnapshot(previous);
  }

  function redo() {
    if (redoStack.length === 0) return;

    const next = redoStack.pop();
    undoStack.push(next);
    _applySnapshot(next);
  }

  /**
   * _applySnapshot
   * --------------
   * Restores both Shapes and CircleOnContainers from a snapshot.
   * Handles both the new {shapes, cocs} format and the legacy array format
   * (for backward compatibility with old undo stacks that had only shapes).
   */
  function _applySnapshot(snapshotData) {
    // Support legacy format (plain array of shapes) as well as new {shapes, cocs}
    const isLegacy = Array.isArray(snapshotData);
    const shapesClone = JSON.parse(JSON.stringify(isLegacy ? snapshotData : snapshotData.shapes));
    const cocsClone   = JSON.parse(JSON.stringify(isLegacy ? [] : (snapshotData.cocs || [])));

    // Restore shapes
    CanvasState.clearShapes();                          // clears both Shapes AND COCs
    shapesClone.forEach(s => CanvasState.addShape(s));

    // Restore COCs (IGW placements) — clearShapes already wiped them
    cocsClone.forEach(coc => CanvasState.addCircleOnContainer(coc));

    // Clear UI selection if the selected shape no longer exists
    const selected = CanvasState.getSelectedId();
    if (selected && !shapesClone.find(s => s.ShapeID === selected)) {
      CanvasState.selectShape(null);
    }

    RenderCanvas.render();
    updateButtons();
  }

  function updateButtons() {
    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');
    if (btnUndo) {
      btnUndo.disabled = undoStack.length <= 1;
      btnUndo.style.opacity = undoStack.length <= 1 ? '0.5' : '1';
      btnUndo.style.cursor  = undoStack.length <= 1 ? 'not-allowed' : 'pointer';
    }
    if (btnRedo) {
      btnRedo.disabled = redoStack.length === 0;
      btnRedo.style.opacity = redoStack.length === 0 ? '0.5' : '1';
      btnRedo.style.cursor  = redoStack.length === 0 ? 'not-allowed' : 'pointer';
    }
  }

  return { init, recordState, undo, redo, clear };

})();
