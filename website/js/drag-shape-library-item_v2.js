/**
 * drag-shape-library-item_v2.js
 * ============================
 * Version V2.1
 */

'use strict';

const DragShapeLibraryItem = (() => {

  console.log('[DragItem] MODULE LOADED - Version V2.1');

  const DRAG_THRESHOLD_PX = 5;
  let _isPointerDown    = false;
  let _startX           = 0;
  let _startY           = 0;
  let _activeDragItemEl = null;
  let _activePayload    = null;

  function beginLibraryItemDrag(event, itemEl) {
    if (!ShapesPanelState.get('DragFromLibraryEnabled')) return;
    
    const itemId     = itemEl.dataset.itemId;
    const allItems   = ShapesPanelState.get('VisibleShapeLibraryItems') || [];
    const item       = allItems.find(i => i.id === itemId);

    if (!item) return;

    // Fail-safe: clear any existing drags
    document.querySelectorAll('.DraggableShapeLibraryItem.dragging').forEach(el => el.classList.remove('dragging'));

    _activePayload = ShapeLibraryDragPayload.buildLibraryItemDragPayload(item);
    if (!_activePayload) return;

    _isPointerDown    = true;
    _startX           = event.clientX;
    _startY           = event.clientY;
    _activeDragItemEl = itemEl;

    document.addEventListener('mousemove', _onMouseMove);
    document.addEventListener('mouseup',   endLibraryItemDrag);
    event.preventDefault();
  }

  function endLibraryItemDrag(event) {
    if (!_isPointerDown) {
      // Even if pointer wasn't down, check for leaked classes
      document.querySelectorAll('.DraggableShapeLibraryItem.dragging').forEach(el => el.classList.remove('dragging'));
      return;
    }

    const wasDragging = ShapesPanelState.get('IsLibraryItemDragging');
    _hideGhost();

    if (wasDragging && _activePayload) {
      const canvas = document.getElementById('MainCanvasViewport');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const inCanvas =
          event.clientX >= rect.left && event.clientX <= rect.right &&
          event.clientY >= rect.top  && event.clientY <= rect.bottom;

        if (inCanvas) {
          const dropX = event.clientX - rect.left;
          const dropY = event.clientY - rect.top;
          console.log('[DragItem] Handoff to Canvas V2.1');
          ShapeLibraryDragPayload.handoffDragToCanvas(_activePayload, dropX, dropY);
        }
      }
    }

    ShapesPanelState.setState({ IsLibraryItemDragging: false });
    
    // FINAL NUCLEAR CLEANUP
    document.querySelectorAll('.DraggableShapeLibraryItem.dragging').forEach(el => el.classList.remove('dragging'));

    _activeDragItemEl = null;
    _activePayload = null;
    _isPointerDown = false;
    document.removeEventListener('mousemove', _onMouseMove);
    document.removeEventListener('mouseup',   endLibraryItemDrag);
  }

  function attachDragListeners(container) {
    if (!container) return;
    const items = container.querySelectorAll('.DraggableShapeLibraryItem');
    items.forEach(itemEl => {
      itemEl.onmousedown = (e) => beginLibraryItemDrag(e, itemEl);
    });
  }

  function _onMouseMove(event) {
    if (!_isPointerDown) return;
    const dx = Math.abs(event.clientX - _startX);
    const dy = Math.abs(event.clientY - _startY);

    if (!ShapesPanelState.get('IsLibraryItemDragging')) {
      if (dx > DRAG_THRESHOLD_PX || dy > DRAG_THRESHOLD_PX) {
        ShapesPanelState.setState({ IsLibraryItemDragging: true });
        if (_activeDragItemEl) _activeDragItemEl.classList.add('dragging');
      }
    }

    if (ShapesPanelState.get('IsLibraryItemDragging')) {
      _updateGhost(event.clientX, event.clientY);
    }
  }

  function _updateGhost(x, y) {
    const ghost = document.getElementById('drag-preview-ghost');
    if (!ghost) return;
    if (ghost.classList.contains('hidden')) {
      ghost.innerHTML = `<div class="drag-ghost-card">
        <div class="drag-ghost-icon">${_activePayload.svgIcon || ''}</div>
        <span class="drag-ghost-label">${_activePayload.itemLabel}</span>
      </div>`;
      ghost.classList.remove('hidden');
    }
    ghost.style.left = x + 'px';
    ghost.style.top  = y + 'px';
  }

  function _hideGhost() {
    const ghost = document.getElementById('drag-preview-ghost');
    if (ghost) ghost.classList.add('hidden');
  }

  return { attachDragListeners };

})();
