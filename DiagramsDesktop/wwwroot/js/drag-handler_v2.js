/**
 * drag-handler_v2.js
 * ==================
 * Version M9.4 — Real-time child propagation + complete COC + child resize clamping
 *
 * M9.4 fixes:
 * 1. Children now move IN REAL-TIME during parent drag (snapshot-based M9 Rule 4)
 * 2. IGW (COC) collision checked during resize of non-parent shapes
 * 3. Child resize is live-clamped to parent inner boundaries during onMouseMove
 */

'use strict';

const DragHandler = (() => {

  console.log('[DragHandler] MODULE LOADED - Version M9.4');

  let _isDragging       = false;
  let _hasMoved         = false;
  let _activeHandle     = 'move';
  let _draggedShapeId   = null;
  let _dragStartWorldPos = null;
  let _shapeSnapshot    = null;

  // M9.4: Snapshots of all descendants at drag-start, keyed by ShapeID.
  // Used so each child's new position = childSnapshot + parentDelta (M9 Rule 4)
  let _childSnapshots = {};

  // ── Public: onMouseDown ────────────────────────────────────────────────────

  function onMouseDown(e, shapeId, handle = 'move') {
    const container = document.getElementById('MainCanvasViewport');
    const rect = container.getBoundingClientRect();

    _draggedShapeId = shapeId;
    _isDragging     = true;
    _hasMoved       = false;
    _activeHandle   = handle;

    _dragStartWorldPos = ScreenToWorld.convert(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );

    const allShapes = CanvasState.getShapes();
    const found     = allShapes.find(s => s.ShapeID === shapeId);
    _shapeSnapshot  = found ? JSON.parse(JSON.stringify(found)) : null;

    // M9 Rule 4 — snapshot ALL descendants so we can compute exact positions
    // each tick without accumulating floating-point drift.
    _childSnapshots = {};
    if (handle === 'move') {
      _snapshotDescendants(shapeId, allShapes);
    }

    document.body.style.cursor = _getCursorForHandle(handle);
  }

  /**
   * _snapshotDescendants
   * Recursively records WorldX/WorldY of every descendant at drag-start.
   */
  function _snapshotDescendants(parentId, allShapes) {
    const children = allShapes.filter(s => s.ParentContainerID === parentId);
    for (const child of children) {
      _childSnapshots[child.ShapeID] = {
        WorldX: child.WorldX,
        WorldY: child.WorldY,
      };
      _snapshotDescendants(child.ShapeID, allShapes);
    }
  }

  // ── Public: onMouseMove ────────────────────────────────────────────────────

  function onMouseMove(e) {
    if (!_isDragging || !_draggedShapeId || !_shapeSnapshot) return;

    const container = document.getElementById('MainCanvasViewport');
    const rect = container.getBoundingClientRect();

    const currentWorldPos = ScreenToWorld.convert(
      e.clientX - rect.left,
      e.clientY - rect.top,
      rect.width,
      rect.height
    );

    const dx = Math.round((currentWorldPos.x - _dragStartWorldPos.x) * 100) / 100;
    const dy = Math.round((currentWorldPos.y - _dragStartWorldPos.y) * 100) / 100;

    const type    = (_shapeSnapshot.Type || 'rectangle').toLowerCase();
    const changes = {};

    if (_activeHandle === 'move') {
      let newX = _shapeSnapshot.WorldX + dx;
      let newY = _shapeSnapshot.WorldY + dy;

      // ── M9: Live containment clamp for children ─────────────────────────
      // Use live-state parent lookup (not snapshot) so shapes re-linked on a
      // previous drop are clamped correctly from the very first move tick.
      if (typeof ContainmentEngine !== 'undefined') {
        const allShapesNow = CanvasState.getShapes();
        const liveShape    = allShapesNow.find(s => s.ShapeID === _draggedShapeId);
        const parentShape  = liveShape?.ParentContainerID
          ? allShapesNow.find(s => s.ShapeID === liveShape.ParentContainerID)
          : null;
        if (parentShape) {
          const geom     = (_shapeSnapshot.GeometryType || _shapeSnapshot.Type || '').toLowerCase();
          const isCircle = geom === 'circle' || geom === 'ellipse';
          if (isCircle) {
            const clamped = ContainmentEngine.clampChildCircle(newX, newY, _shapeSnapshot, parentShape);
            newX = clamped.x; newY = clamped.y;
          } else {
            const clamped = ContainmentEngine.clampChildRect(newX, newY, _shapeSnapshot, parentShape);
            newX = clamped.x; newY = clamped.y;
          }
        }
      }

      changes.WorldX = newX;
      changes.WorldY = newY;

      // ── M9 Rule 4 — Propagate move to ALL descendants in real-time ───────
      // Equation: NewChildCenterX = ChildSnapshot.WorldX + (NewParentX - ParentSnapshot.WorldX)
      const parentDeltaX = newX - _shapeSnapshot.WorldX;
      const parentDeltaY = newY - _shapeSnapshot.WorldY;

      if (parentDeltaX !== 0 || parentDeltaY !== 0) {
        for (const [childId, snap] of Object.entries(_childSnapshots)) {
          CanvasState.updateShape(childId, {
            WorldX: snap.WorldX + parentDeltaX,
            WorldY: snap.WorldY + parentDeltaY,
          });
        }

      }

    } else {
      // ── RESIZE MATH ───────────────────────────────────────────────────────
      if (type === 'line') {
        const hw = _shapeSnapshot.Width  / 2;
        const hh = _shapeSnapshot.Height / 2;
        const sP1X = _shapeSnapshot.WorldX - hw;
        const sP1Y = _shapeSnapshot.WorldY + hh;
        const sP2X = _shapeSnapshot.WorldX + hw;
        const sP2Y = _shapeSnapshot.WorldY - hh;

        if (_activeHandle === 'p1') {
          const nP1X = sP1X + dx; const nP1Y = sP1Y + dy;
          changes.WorldX = (nP1X + sP2X) / 2; changes.WorldY = (nP1Y + sP2Y) / 2;
          changes.Width  = sP2X - nP1X;        changes.Height = nP1Y - sP2Y;
        } else if (_activeHandle === 'p2') {
          const nP2X = sP2X + dx; const nP2Y = sP2Y + dy;
          changes.WorldX = (sP1X + nP2X) / 2; changes.WorldY = (sP1Y + nP2Y) / 2;
          changes.Width  = nP2X - sP1X;        changes.Height = sP1Y - nP2Y;
        }

      } else if (type === 'circle' || type === 'ellipse' || _shapeSnapshot.GeometryType === 'circle') {
        if (typeof CircleResize !== 'undefined') {
          const handleMap = { 'n': 'TopResizeControlPoint', 's': 'BottomResizeControlPoint',
                              'e': 'RightResizeControlPoint', 'w': 'LeftResizeControlPoint' };
          const mappedHandle = handleMap[_activeHandle];
          if (mappedHandle) {
            const tempCircle = { type: 'circle', Radius: _shapeSnapshot.Radius || _shapeSnapshot.Width / 2 };
            CircleResize.handleResizeTick(tempCircle, dx, dy, mappedHandle);
            changes.Radius = CircleInteractionState.temporaryCandidateRadius;
            changes.Width  = changes.Radius * 2;
            changes.Height = changes.Radius * 2;
          }
        } else {
          const dist   = Math.sqrt((currentWorldPos.x - _shapeSnapshot.WorldX) ** 2 +
                                   (currentWorldPos.y - _shapeSnapshot.WorldY) ** 2);
          changes.Radius = dist;
          changes.Width  = dist * 2;
          changes.Height = dist * 2;
        }

      } else {
        // Rectangle resize handles
        const sw = _shapeSnapshot.Width,  sh = _shapeSnapshot.Height;
        const sx = _shapeSnapshot.WorldX, sy = _shapeSnapshot.WorldY;

        let left   = sx - sw / 2;
        let right  = sx + sw / 2;
        let top    = sy + sh / 2;
        let bottom = sy - sh / 2;

        if (_activeHandle.includes('e')) right += dx;
        if (_activeHandle.includes('w')) left  += dx;
        if (_activeHandle.includes('n')) top   += dy;
        if (_activeHandle.includes('s')) bottom += dy;

        // Apply minimum size BEFORE parent clamping to preserve opposite edge
        if (right - left < 10) {
            if (_activeHandle.includes('e')) right = left + 10;
            if (_activeHandle.includes('w')) left  = right - 10;
        }
        if (top - bottom < 10) {
            if (_activeHandle.includes('n')) top    = bottom + 10;
            if (_activeHandle.includes('s')) bottom = top - 10;
        }

        // ── M9: Live clamp child resize to parent inner boundaries ──────────
        // If this shape is a child (has a parent), prevent it from growing
        // outside the parent's inner boundaries during resize.
        // Use live-state parent lookup so newly-linked shapes are clamped
        // correctly without requiring a full drag-start cycle.
        if (typeof DeriveParentInnerBoundaries !== 'undefined') {
          const allShapesNow2 = CanvasState.getShapes();
          const liveShape2    = allShapesNow2.find(s => s.ShapeID === _draggedShapeId);
          const parentShape2  = liveShape2?.ParentContainerID
            ? allShapesNow2.find(s => s.ShapeID === liveShape2.ParentContainerID)
            : null;
          if (parentShape2) {
            const bounds  = DeriveParentInnerBoundaries.fromShape(parentShape2);
            const EPSILON = 1;

            const pLeft   = bounds.ParentInnerLeftX   + EPSILON;
            const pRight  = bounds.ParentInnerRightX  - EPSILON;
            const pTop    = bounds.ParentInnerTopY    - EPSILON;
            const pBottom = bounds.ParentInnerBottomY + EPSILON;

            // Clamp only the edges that are actively being dragged
            if (_activeHandle.includes('w') && left   < pLeft)   left   = pLeft;
            if (_activeHandle.includes('e') && right  > pRight)  right  = pRight;
            if (_activeHandle.includes('s') && bottom < pBottom) bottom = pBottom;
            if (_activeHandle.includes('n') && top    > pTop)    top    = pTop;

            // Re-apply minimum size in case clamping crushed the shape
            if (right - left < 10) {
                if (_activeHandle.includes('e')) right = left + 10;
                if (_activeHandle.includes('w')) left  = right - 10;
            }
            if (top - bottom < 10) {
                if (_activeHandle.includes('n')) top    = bottom + 10;
                if (_activeHandle.includes('s')) bottom = top - 10;
            }
          }
        }

        changes.Width  = right - left;
        changes.Height = top - bottom;
        changes.WorldX = (left + right) / 2;
        changes.WorldY = (top + bottom) / 2;
      }
    }

    _hasMoved = true;
    CanvasState.updateShape(_draggedShapeId, changes);

    // ── M8: Recalculate COCs (IGW) for the dragged/resized shape and all descendants ──
    // COCs must be repositioned on every tick AFTER the parent geometry is updated in state.
    if (typeof RecalculateEdgeCirclesOnParentChange !== 'undefined') {
      if (_activeHandle === 'move') {
        RecalculateEdgeCirclesOnParentChange.onParentMoved(_draggedShapeId);
        for (const childId of Object.keys(_childSnapshots)) {
          RecalculateEdgeCirclesOnParentChange.onParentMoved(childId);
        }
      } else {
        RecalculateEdgeCirclesOnParentChange.onParentResized(_draggedShapeId);
      }
    }

    RenderCanvas.render();
  }

  // ── Public: onMouseUp ──────────────────────────────────────────────────────

  function onMouseUp() {
    if (!_isDragging) return;

    const finalShape = CanvasState.getShapes().find(s => s.ShapeID === _draggedShapeId);
    if (finalShape && _shapeSnapshot) {
      const allShapes = CanvasState.getShapes();

      // Auto-fit to parent container if applicable
      if (_activeHandle === 'move' && typeof ShapeCategories !== 'undefined') {
        const itemDef = ShapeCategories.getItemByType(finalShape.Type);
        if (itemDef && itemDef.parentType) {
          const requiredTypes = Array.isArray(itemDef.parentType) ? itemDef.parentType : [itemDef.parentType];
          const parentShape = allShapes.find(s => {
            if (s.ShapeID === finalShape.ShapeID) return false;
            if (!requiredTypes.includes(s.Type)) return false;
            if (s.Type === finalShape.Type) return false;
            const hw = s.Width / 2;
            const hh = s.Height / 2;
            return (
              finalShape.WorldX >= s.WorldX - hw && finalShape.WorldX <= s.WorldX + hw &&
              finalShape.WorldY >= s.WorldY - hh && finalShape.WorldY <= s.WorldY + hh
            );
          });

          if (parentShape) {
            const oldX = finalShape.WorldX;
            const oldY = finalShape.WorldY;
            const oldW = finalShape.Width;
            const oldH = finalShape.Height;

            if (typeof ContainmentEngine !== 'undefined') {
              ContainmentEngine.fitShapeToParent(finalShape, parentShape);
            }

            const adjX = finalShape.WorldX - oldX;
            const adjY = finalShape.WorldY - oldY;

            CanvasState.updateShape(finalShape.ShapeID, {
              WorldX: finalShape.WorldX,
              WorldY: finalShape.WorldY,
              Width: finalShape.Width,
              Height: finalShape.Height,
              Radius: finalShape.Radius,
              ParentContainerID: parentShape.ShapeID
            });

            // Shift descendants by the adjustment delta
            if (adjX !== 0 || adjY !== 0) {
              const descendants = _getDescendantIds(finalShape.ShapeID, allShapes);
              for (const childId of descendants) {
                const child = allShapes.find(s => s.ShapeID === childId);
                if (child) {
                  CanvasState.updateShape(childId, {
                    WorldX: child.WorldX + adjX,
                    WorldY: child.WorldY + adjY
                  });
                }
              }
            }

            // If the shape shrunk, check that children are not excluded
            if ((finalShape.Width < oldW || finalShape.Height < oldH) && typeof DeriveParentInnerBoundaries !== 'undefined' && typeof ContainmentEngine !== 'undefined') {
              const newBounds = DeriveParentInnerBoundaries.fromShape(finalShape);
              const parentResult = ContainmentEngine.validateParentResize(newBounds, finalShape.ShapeID, allShapes);
              if (!parentResult.valid) {
                console.warn('[DragHandler] M9 Parent auto-shrink rejected due to child exclusion:', parentResult.reason);
                _snapBack();
                RenderCanvas.render();
                _reset();
                return;
              }
            }
          }
        }
      }

      let collided = false;

      // Collect all descendants — parent always "overlaps" its own children, skip them
      const descendantIds = _getDescendantIds(_draggedShapeId, allShapes);

      const ancestorIds = new Set();
      let curr = finalShape;
      while (curr && curr.ParentContainerID) {
        ancestorIds.add(curr.ParentContainerID);
        curr = allShapes.find(s => s.ShapeID === curr.ParentContainerID);
      }

      for (const other of allShapes) {
        if (other.ShapeID === _draggedShapeId) continue;
        if (descendantIds.has(other.ShapeID))  continue;
        // Skip our own ancestor containers
        if (ancestorIds.has(other.ShapeID)) continue;

        if (Collision.checkCollision(_obj(finalShape), _obj(other))) {
          collided = true;
          break;
        }
      }

      // ── COC collision check ───────────────────────────────────────────────
      // During MOVE:   skip COC that belongs to the moved shape (own IGW) and its descendants
      // During RESIZE: skip COC that belongs to the RESIZED shape (its own IGW) and its descendants
      //               but DO check all other COC circles for overlap
      if (!collided && typeof CircleOnContainerState !== 'undefined') {
        const cocs = CircleOnContainerState.getAll();
        for (const coc of cocs) {
          // Skip IGW attached to the shape being dragged/resized, or any of its descendants
          if (coc.ParentContainerID === _draggedShapeId || descendantIds.has(coc.ParentContainerID)) continue;
          const cocObj = { type: 'circle', cx: coc.CenterX, cy: coc.CenterY, r: coc.Radius };
          if (Collision.checkCollision(_obj(finalShape), cocObj)) {
            collided = true;
            break;
          }
        }
      }

      if (collided) {
        console.warn('[DragHandler] REJECTED overlap — snapping back');
        _snapBack();
        RenderCanvas.render();
      } else if (_hasMoved) {

        // ── Milestone 4: parent-hierarchy validation on move ──────────────────
        if (_activeHandle === 'move' && typeof ParentDropValidator !== 'undefined' && typeof ShapeCategories !== 'undefined') {
          const itemDef = ShapeCategories.getItemByType(finalShape.Type);
          if (itemDef) {
            // Pass child dimensions for strict bounding-box containment check.
            // This rejects shapes whose CENTER is inside the parent but whose
            // EDGES bleed outside (e.g. a large VPC partially outside a Region).
            const result = ParentDropValidator.validate(
              itemDef,
              finalShape.WorldX, finalShape.WorldY,
              finalShape.ShapeID,
              { childWidth: finalShape.Width, childHeight: finalShape.Height }
            );
            if (!result.ok) {
              console.warn('[DragHandler] M4 Parent hierarchy violated — snapping back:', result.reason);
              if (typeof DropHandler !== 'undefined' && DropHandler.showError) {
                DropHandler.showError(result.reason);
              }
              _snapBack();
              RenderCanvas.render();
              _reset();
              return;
            }

            // Valid! Update the parent reference
            const existingShapes = CanvasState.getShapes();
            const requiredTypes = Array.isArray(itemDef.parentType) ? itemDef.parentType : [itemDef.parentType];
            const parentShape = existingShapes.find(s => {
              if (s.ShapeID === finalShape.ShapeID) return false;
              if (!requiredTypes.includes(s.Type)) return false;
              if (s.Type === finalShape.Type) return false;
              const hw = s.Width / 2;
              const hh = s.Height / 2;
              return (
                finalShape.WorldX >= s.WorldX - hw && finalShape.WorldX <= s.WorldX + hw &&
                finalShape.WorldY >= s.WorldY - hh && finalShape.WorldY <= s.WorldY + hh
              );
            });
            if (parentShape) {
              CanvasState.updateShape(finalShape.ShapeID, { ParentContainerID: parentShape.ShapeID });
              console.log(`[DragHandler] Re-linked ${finalShape.Label} (${finalShape.ShapeID}) -> parent ${parentShape.Label} (${parentShape.ShapeID})`);
            } else {
              CanvasState.updateShape(finalShape.ShapeID, { ParentContainerID: null });
            }
          }
        }

        if (_activeHandle === 'move' && typeof ContainmentEngine !== 'undefined') {
          const movedShape  = CanvasState.getShapes().find(s => s.ShapeID === _draggedShapeId);
          const parentShape = movedShape ? ContainmentEngine.getParentShape(movedShape, allShapes) : null;

          // 1. Final containment check
          if (movedShape && parentShape) {
            const containOk = ContainmentEngine.validateChildInParent(movedShape, parentShape);
            if (!containOk.valid) {
              console.warn('[DragHandler] M9 Containment violated — snapping back:', containOk.reason);
              _snapBack();
              RenderCanvas.render();
              _reset();
              return;
            }
          }

          // 2. N-1 sibling overlap check
          if (movedShape) {
            const siblings  = ContainmentEngine.getSiblings(_draggedShapeId, allShapes);
            const sibResult = ContainmentEngine.checkSiblingOverlap(movedShape, siblings);
            if (sibResult.collided) {
              console.warn('[DragHandler] M9 Sibling overlap — snapping back. Sibling:', sibResult.siblingId);
              _snapBack();
              RenderCanvas.render();
              _reset();
              return;
            }
          }

          // 3. Children were already moved in real-time during onMouseMove — no re-propagation needed
        }

        // ── M9: On resize, validate parent doesn't exclude children ────────
        if (_activeHandle !== 'move' && typeof ContainmentEngine !== 'undefined') {
          const resizedShape = CanvasState.getShapes().find(s => s.ShapeID === _draggedShapeId);
          if (resizedShape) {
            const newBounds    = DeriveParentInnerBoundaries.fromShape(resizedShape);
            const parentResult = ContainmentEngine.validateParentResize(newBounds, _draggedShapeId, CanvasState.getShapes());
            if (!parentResult.valid) {
              console.warn('[DragHandler] M9 Parent resize rejected:', parentResult.reason);
              _snapBack();
              RenderCanvas.render();
              _reset();
              return;
            }
          }
        }

        // Successful action — record state
        if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
        if (typeof DirtyTracker   !== 'undefined') DirtyTracker.markDirty();

        // ── M8: Recalculate attached COCs when parent shape moves/resizes ──
        if (typeof RecalculateEdgeCirclesOnParentChange !== 'undefined') {
          if (_activeHandle === 'move') {
            RecalculateEdgeCirclesOnParentChange.onParentMoved(finalShape.ShapeID);
          } else {
            RecalculateEdgeCirclesOnParentChange.onParentResized(finalShape.ShapeID);
          }
        }

        // M6 / M7 circle events
        const t           = (finalShape.Type || 'rectangle').toLowerCase();
        const isCircleGeom = t === 'circle' || t === 'ellipse' || finalShape.GeometryType === 'circle';
        if (isCircleGeom && typeof CircleEvents !== 'undefined') {
          if (_activeHandle === 'move') CircleEvents.dispatchMoved(finalShape.ShapeID);
          else                          CircleEvents.dispatchResized(finalShape.ShapeID);
        }
      }
    }

    _reset();
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * _snapBack — restores the dragged shape and all children to their snapshot positions.
   */
  function _snapBack() {
    if (!_shapeSnapshot) return;
    CanvasState.updateShape(_draggedShapeId, {
      WorldX: _shapeSnapshot.WorldX, WorldY: _shapeSnapshot.WorldY,
      Width:  _shapeSnapshot.Width,  Height: _shapeSnapshot.Height,
      Radius: _shapeSnapshot.Radius,
    });
    // Also restore all children to their original snapshot positions
    for (const [childId, snap] of Object.entries(_childSnapshots)) {
      CanvasState.updateShape(childId, { WorldX: snap.WorldX, WorldY: snap.WorldY });
    }
    
    // M8: Also restore attached COCs when snapping back
    if (typeof RecalculateEdgeCirclesOnParentChange !== 'undefined') {
      RecalculateEdgeCirclesOnParentChange.onParentMoved(_draggedShapeId);
      for (const childId of Object.keys(_childSnapshots)) {
        RecalculateEdgeCirclesOnParentChange.onParentMoved(childId);
      }
    }
  }

  function _reset() {
    _isDragging      = false;
    _hasMoved        = false;
    _draggedShapeId  = null;
    _shapeSnapshot   = null;
    _childSnapshots  = {};
    document.body.style.cursor = 'default';
  }

  function _obj(s) {
    const t    = (s.Type || 'rectangle').toLowerCase();
    const geom = (s.GeometryType || '').toLowerCase();
    if (t === 'line') {
      return { type: 'line',
               x1: s.WorldX - s.Width/2, y1: s.WorldY - s.Height/2,
               x2: s.WorldX + s.Width/2, y2: s.WorldY + s.Height/2 };
    }
    if (t === 'circle' || t === 'ellipse' || geom === 'circle') {
      const r = s.Radius ?? s.Width / 2;
      return { type: 'circle', cx: s.WorldX, cy: s.WorldY, r };
    }
    return { type: 'rectangle',
             x: s.WorldX - s.Width/2, y: s.WorldY - s.Height/2,
             width: s.Width, height: s.Height };
  }

  function _getCursorForHandle(h) {
    if (h === 'nw' || h === 'se') return 'nwse-resize';
    if (h === 'ne' || h === 'sw') return 'nesw-resize';
    if (h === 'n'  || h === 's' ) return 'ns-resize';
    if (h === 'e'  || h === 'w' ) return 'ew-resize';
    if (h === 'p1' || h === 'p2') return 'pointer';
    return 'move';
  }

  /**
   * _getDescendantIds
   * Returns a Set of all ShapeIDs that are descendants of parentId.
   */
  function _getDescendantIds(parentId, allShapes) {
    const result = new Set();
    const queue  = [parentId];
    while (queue.length > 0) {
      const current  = queue.shift();
      const children = allShapes.filter(s => s.ParentContainerID === current);
      for (const child of children) {
        result.add(child.ShapeID);
        queue.push(child.ShapeID);
      }
    }
    return result;
  }

  function isActive() { return _isDragging; }

  return { onMouseDown, onMouseMove, onMouseUp, isActive };

})();
