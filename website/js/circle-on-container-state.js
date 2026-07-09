/**
 * circle-on-container-state.js
 * ============================
 * Milestone 8 — In-memory state store for Circle On Containers.
 *
 * This module is a dedicated state layer that mirrors the
 * activeDiagram.CircleOnContainers array in CanvasState but
 * provides a focused, type-safe API for COC operations.
 */

'use strict';

const CircleOnContainerState = (() => {

  console.log('[CircleOnContainerState] MODULE LOADED - Version M8.0');

  let _selectedCocId  = null;
  let _hoveredCocId   = null;
  let _dragState      = null; // { cocId, mode: 'move'|'resize', handle: string }

  // ── Getters that delegate to CanvasState ────────────────────────
  function getAll() {
    return CanvasState.getCircleOnContainers();
  }

  function getById(id) {
    return getAll().find(c => c.CircleOnContainerID === id) ?? null;
  }

  function getByParentId(parentId) {
    return getAll().filter(c => c.ParentContainerID === parentId);
  }

  // ── CRUD ────────────────────────────────────────────────────────
  function add(model) {
    const validation = CircleOnContainerModel.validateCircleOnContainerModel(model);
    if (!validation.ok) {
      console.warn('[CircleOnContainerState] add rejected:', validation.reason);
      return false;
    }
    CanvasState.addCircleOnContainer(model);
    if (typeof DirtyTracker !== 'undefined') DirtyTracker.markDirty();
    return true;
  }

  function update(id, changes) {
    changes.UpdatedAt = new Date().toISOString();
    CanvasState.updateCircleOnContainer(id, changes);
    if (typeof DirtyTracker !== 'undefined') DirtyTracker.markDirty();
  }

  function remove(id) {
    CanvasState.removeCircleOnContainer(id);
    if (_selectedCocId === id) _selectedCocId = null;
    if (_hoveredCocId  === id) _hoveredCocId  = null;
    if (typeof DirtyTracker !== 'undefined') DirtyTracker.markDirty();
  }

  // ── Selection & Hover ────────────────────────────────────────────
  function selectCircleOnContainer(id) {
    _selectedCocId = id;
    // Deselect any shape/connection
    if (id && typeof CanvasState !== 'undefined') {
      CanvasState.selectShape(null);
      if (typeof CanvasState.selectConnection === 'function') CanvasState.selectConnection(null);
    }
  }

  function hoverCircleOnContainer(id) { 
    _hoveredCocId = id; 
    if (id && typeof CanvasState !== 'undefined') {
      CanvasState.hoverShape(null);
    }
  }

  function getSelectedId() { return _selectedCocId; }
  function getHoveredId()  { return _hoveredCocId; }

  function clearSelection() { _selectedCocId = null; }

  // ── Drag State ──────────────────────────────────────────────────
  function setDragState(state) { _dragState = state; }
  function getDragState()      { return _dragState; }
  function clearDragState()    { _dragState = null; }

  return {
    getAll, getById, getByParentId,
    add, update, remove,
    selectCircleOnContainer,
    hoverCircleOnContainer,
    getSelectedId, getHoveredId,
    clearSelection,
    setDragState, getDragState, clearDragState,
  };

})();
