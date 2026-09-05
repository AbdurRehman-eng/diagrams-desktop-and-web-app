/**
 * drop-handler_v2.js
 * ==================
 * Version M4.0 — Cloud Shape Library + Parent Drop Validation
 *
 * M4.0 changes:
 *   - Calls ParentDropValidator.validate() before creating any shape.
 *   - Uses item definition (defaultWidth, defaultHeight, fillColor, strokeColor)
 *     from ShapeCategories for precise sizing per shape type.
 *   - Blocks placeholder "Coming Soon" items from being placed.
 *   - Shows user-friendly toast/alert on validation failure.
 */

'use strict';

const DropHandler = (() => {

  console.log('[DropHandler] MODULE LOADED - Version M8.0');

  function init() {
    window.addEventListener('libraryItemDroppedOnCanvas', onDrop);
  }

  function onDrop(e) {
    const { payload, dropX, dropY } = e.detail;

    const container = document.getElementById('MainCanvasViewport');
    if (!container) return;

    const rect  = container.getBoundingClientRect();
    const safeX = Math.max(0, Math.min(dropX, rect.width));
    const safeY = Math.max(0, Math.min(dropY, rect.height));

    const worldPos = ScreenToWorld.convert(safeX, safeY, rect.width, rect.height);

    // ── M4: Retrieve full item definition from ShapeCategories ────
    const itemDef = (typeof ShapeCategories !== 'undefined')
      ? ShapeCategories.getItemByType(payload.itemType)
      : null;

    // ── M8: Edge-attachment shapes bypass the normal drop pipeline ─
    // Must run BEFORE ParentDropValidator to intercept IGW before hierarchy check.
    if (itemDef && itemDef.edgeAttachment) {
      // Entitlements Check for edge-attachment shapes
      if (typeof Licensing !== 'undefined') {
        const requiredEnt = Licensing.getRequiredEntitlementForShapeType(itemDef.type);
        if (!Licensing.hasEntitlement(requiredEnt)) {
          _showDropError(`Your current plan does not support creating a ${itemDef.label || itemDef.type}. Please upgrade your subscription.`);
          return;
        }
      }
      _handleEdgeAttachmentDrop(payload, itemDef, worldPos);
      return;
    }

    // ── GML License Entitlements Gating ──
    if (itemDef && typeof Licensing !== 'undefined') {
      const requiredEnt = Licensing.getRequiredEntitlementForShapeType(itemDef.type);
      if (!Licensing.hasEntitlement(requiredEnt)) {
        _showDropError(`Your current plan does not support creating a ${itemDef.label || itemDef.type}. Please upgrade your subscription.`);
        return;
      }
    }

    // ── M4: Parent-hierarchy validation ───────────────────────────
    if (typeof ParentDropValidator !== 'undefined' && itemDef) {
      const result = ParentDropValidator.validate(itemDef, worldPos.x, worldPos.y);
      if (!result.ok) {
        _showDropError(result.reason);
        return;  // Block the drop
      }
    }

    // ── Determine geometry type from itemDef („geometryType“ field) ────
    const geometryType = itemDef?.geometryType ?? null;
    const typeLC  = payload.itemType.toLowerCase();
    const isLine  = typeLC === 'line';
    const isCircle= typeLC === 'circle' || typeLC === 'ellipse' || geometryType === 'circle';

    const w = itemDef?.defaultWidth  ?? (isLine ? 80 : isCircle ? 80 : 100);
    const h = itemDef?.defaultHeight ?? (isLine ? 0  : isCircle ? 80 : 60);

    // ── Determine colors ──────────────────────────────────────────
    // Prefer itemDef colours; fall back to SVG attribute extraction
    let strokeColor = itemDef?.strokeColor ?? '#6366f1';
    let fillColor   = itemDef?.fillColor   ?? '#6366f1';

    if (!itemDef?.strokeColor && !itemDef?.fillColor) {
      const fillMatch   = payload.svgIcon.match(/fill="([^"]+)"/);
      const strokeMatch = payload.svgIcon.match(/stroke="([^"]+)"/);
      if (fillMatch   && fillMatch[1]   !== 'none' && fillMatch[1]   !== 'currentColor') fillColor   = fillMatch[1];
      if (strokeMatch && strokeMatch[1] !== 'none' && strokeMatch[1] !== 'currentColor') strokeColor = strokeMatch[1];
    }

    // ── Build shape object ────────────────────────────────────────
    let shapeId = 'shape-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5);
    if (typeLC === 'aws-vpc') {
      shapeId = 'GML-VPC-' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    } else if (typeLC === 'aws-availability-zone') {
      shapeId = 'GML-AZ-' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    } else if (typeLC === 'aws-subnet') {
      shapeId = 'GML-SUBNET-' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    } else if (typeLC === 'aws-route-table') {
      shapeId = 'GML-RT-' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    } else if (typeLC === 'aws-ec2') {
      shapeId = 'GML-EC2-' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    } else if (typeLC === 'aws-lambda') {
      shapeId = 'GML-LAMBDA-' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    } else if (typeLC === 'aws-nat') {
      shapeId = 'GML-NAT-' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    } else if (typeLC === 'aws-region') {
      shapeId = 'GML-REG-' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    }

    const newShape = {
      ShapeID:     shapeId,
      DiagramID:   CanvasState.getActiveDiagram()?.DiagramID ?? 'unsaved',
      Type:        payload.itemType,
      Label:       payload.itemLabel,
      WorldX:      worldPos.x,
      WorldY:      worldPos.y,
      Width:       w,
      Height:      h,
      Color:       fillColor,
      StrokeColor: strokeColor,
      FillColor:   fillColor,
      SvgIcon:     payload.svgIcon,
    };

    // Store geometry metadata so renderer and collision use the right M2/M3 geometry
    if (geometryType) newShape.GeometryType = geometryType;
    if (itemDef?.transparentFill) newShape.TransparentFill = true;

    if (isCircle) {
      const gv = CanvasState.getGlobalVars();
      newShape.Radius = w / 2;
      newShape.ZOrder = 1;
      newShape.HoverPaddingRadiusRatio = gv.circle?.hoverPaddingRatio ?? 1.1;
      newShape.ProtectionPaddingRadiusRatio = gv.circle?.protectionPaddingRatio ?? 1.2;
      newShape.HoverPaddingColor = gv.circle?.resizeControlPointHoverColor ?? '#ffffff';
      newShape.ProtectionPaddingColor = 'transparent';
    }

    // ── Collision Check before drop (regular shapes + COC circles) ──────────
    if (typeof Collision !== 'undefined') {
      const allShapes = CanvasState.getShapes();
      
      let intendedParentId = null;
      if (itemDef && itemDef.parentType && typeof ParentDropValidator !== 'undefined') {
        const requiredTypes = Array.isArray(itemDef.parentType) ? itemDef.parentType : [itemDef.parentType];
        const overlappingParents = allShapes.filter(s => {
          if (!requiredTypes.includes(s.Type)) return false;
          if (s.Type === newShape.Type) return false;
          const hw = s.Width / 2;
          const hh = s.Height / 2;
          return (
            worldPos.x >= s.WorldX - hw && worldPos.x <= s.WorldX + hw &&
            worldPos.y >= s.WorldY - hh && worldPos.y <= s.WorldY + hh
          );
        }).sort((a, b) => (a.Width * a.Height) - (b.Width * b.Height));
        
        if (overlappingParents.length > 0) {
          const pShape = overlappingParents[0];
          intendedParentId = pShape.ShapeID;
          if (typeof ContainmentEngine !== 'undefined') {
            ContainmentEngine.fitShapeToParent(newShape, pShape);
          }
        }
      }

      const dropObj = _obj(newShape);
      let collided = false;

      const ancestorIds = new Set();
      let currParentId = intendedParentId;
      while (currParentId) {
        ancestorIds.add(currParentId);
        const pShape = allShapes.find(s => s.ShapeID === currParentId);
        currParentId = pShape ? pShape.ParentContainerID : null;
      }
      
      for (const other of allShapes) {
        if (ancestorIds.has(other.ShapeID)) continue;
        if (Collision.checkCollision(dropObj, _obj(other))) {
          collided = true;
          break;
        }
      }

      // Also check against COC circles (e.g. Internet Gateway on VPC border)
      if (!collided && typeof CircleOnContainerState !== 'undefined') {
        const cocs = CircleOnContainerState.getAll();
        for (const coc of cocs) {
          const cocObj = { type: 'circle', cx: coc.CenterX, cy: coc.CenterY, r: coc.Radius };
          if (Collision.checkCollision(dropObj, cocObj)) {
            collided = true;
            break;
          }
        }
      }
      
      // Finally, check that the dropped shape does not cross its intended parent's boundary
      if (!collided && intendedParentId && typeof ContainmentEngine !== 'undefined') {
        const pShape = allShapes.find(s => s.ShapeID === intendedParentId);
        if (pShape) {
          newShape.ParentContainerID = intendedParentId; // temporarily set for protection padding calc
          const containOk = ContainmentEngine.validateChildInParent(newShape, pShape);
          newShape.ParentContainerID = null; // reset
          if (!containOk.valid) {
             collided = true;
          }
        }
      }

      if (collided) {
        _showDropError("Shapes cannot overlap boundaries.");
        return; // Block drop
      }
    }

    CanvasState.addShape(newShape);

    // Record which parent container this shape was dropped into (for delete guard)
    if (itemDef && itemDef.parentType && typeof ParentDropValidator !== 'undefined') {
      const existingShapes = CanvasState.getShapes();
      const requiredTypes = Array.isArray(itemDef.parentType) ? itemDef.parentType : [itemDef.parentType];
      const matchingParents = existingShapes.filter(s => {
        if (!requiredTypes.includes(s.Type)) return false;
        if (s.Type === newShape.Type) return false;
        const hw = s.Width / 2;
        const hh = s.Height / 2;
        return (
          newShape.WorldX >= s.WorldX - hw && newShape.WorldX <= s.WorldX + hw &&
          newShape.WorldY >= s.WorldY - hh && newShape.WorldY <= s.WorldY + hh
        );
      }).sort((a, b) => (a.Width * a.Height) - (b.Width * b.Height));

      const parentShape = matchingParents[0] || null;
      if (parentShape) {
        newShape.ParentContainerID = parentShape.ShapeID;
        console.log(`[DropHandler] Linked ${newShape.Label} (${newShape.ShapeID}) -> parent ${parentShape.Label} (${parentShape.ShapeID})`);
      }
    }
    if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
    if (typeof DirtyTracker   !== 'undefined') DirtyTracker.markDirty();
    if (typeof TemporaryActionFile !== 'undefined') TemporaryActionFile.update();
    RenderCanvas.render();
  }

  // ── Error feedback ────────────────────────────────────────────────────────

  /**
   * _showDropError
   * Shows a temporary on-canvas toast message explaining why a drop was blocked.
   * Falls back to console.warn if the toast container is unavailable.
   */
  function _showDropError(message) {
    console.warn('[DropHandler] Drop blocked:', message);

    // Remove any existing toast
    const old = document.getElementById('drop-error-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.id        = 'drop-error-toast';
    toast.className = 'drop-error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto-dismiss after 10 seconds
    setTimeout(() => toast.remove(), 10000);
  }

  function _obj(s) {
    const t    = (s.Type || 'rectangle').toLowerCase();
    const geom = (s.GeometryType || '').toLowerCase();
    if (t === 'line') {
      return { 
        type: 'line', 
        x1: s.WorldX - s.Width/2, 
        y1: s.WorldY - s.Height/2, 
        x2: s.WorldX + s.Width/2, 
        y2: s.WorldY + s.Height/2 
      };
    }
    if (t === 'circle' || t === 'ellipse' || geom === 'circle') {
      return { type: 'circle', cx: s.WorldX, cy: s.WorldY, r: s.Width / 2 };
    }
    return { type: 'rectangle', x: s.WorldX - s.Width/2, y: s.WorldY - s.Height/2, width: s.Width, height: s.Height };
  }

  // ── M8: Edge-attachment drop flow ─────────────────────────────────────────

  function _handleEdgeAttachmentDrop(payload, itemDef, worldPos) {
    // Find a valid host container near the drop point
    const allShapes = CanvasState.getShapes();
    const allowedContainerType = itemDef.edgeContainerType; // e.g. 'aws-vpc'

    // Find the innermost (smallest area) valid container that contains the drop point
    let bestContainer = null;
    let bestArea = Infinity;

    for (const shape of allShapes) {
      if (shape.Type.toLowerCase() !== allowedContainerType.toLowerCase()) continue;

      // Validate via EdgeAttachmentRulesLoader if loaded
      if (typeof EdgeAttachmentRulesLoader !== 'undefined' && EdgeAttachmentRulesLoader.isLoaded()) {
        if (!EdgeAttachmentRulesLoader.isEdgeAllowed(itemDef.label, shape.Type)) continue;
      }

      const itemDefRadius = (itemDef.defaultWidth || 60) / 2;
      const padRatio = CanvasState.getGlobalVars()?.rectangle?.hoverPaddingRatio ?? 0.05;
      const pad = Math.min(shape.Width, shape.Height) * padRatio;
      
      const hw = shape.Width  / 2 + pad + itemDefRadius;
      const hh = shape.Height / 2 + pad + itemDefRadius;

      const inBounds = (
        worldPos.x >= shape.WorldX - hw &&
        worldPos.x <= shape.WorldX + hw &&
        worldPos.y >= shape.WorldY - hh &&
        worldPos.y <= shape.WorldY + hh
      );

      if (inBounds) {
        const area = shape.Width * shape.Height;
        if (area < bestArea) {
          bestArea = area;
          bestContainer = shape;
        }
      }
    }

    if (!bestContainer) {
      _showDropError('Internet Gateway must be dropped onto a VPC.');
      return;
    }

    // Project the drop point to the nearest VPC edge
    const edgeResult = ProjectPointerToContainerEdge.project(
      worldPos.x, worldPos.y, bestContainer
    );

    // Build the CircleOnContainer model (we need it to get CenterX/CenterY/Radius)
    const igwHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    const model = CircleOnContainerModel.createCircleOnContainerModel({
      CircleOnContainerID:       'GML-IGW-' + igwHex,
      ParentContainerID:         bestContainer.ShapeID,
      ParentContainerType:       bestContainer.Type,
      DeviceOnContainerEdgeType: itemDef.label,
      HostEdge:                  edgeResult.HostEdge,
      EdgeParameterT:            edgeResult.EdgeParameterT,
      SvgIcon:                   payload.svgIcon,
      Label:                     payload.itemLabel,
      appearance: {
        FillColor:  itemDef.fillColor   ?? '#f58536',
        LineColor:  itemDef.strokeColor ?? '#f58536',
      },
    });

    // ── Collision check using same circle variables as M3 circle ────────────
    // CenterX, CenterY, Radius are the exact same fields used by the circle geometry.
    // We only skip the specific VPC the IGW is attached to (its host edge sits on that
    // container's border by design). All OTHER shapes — including AZ, Region, siblings —
    // must be checked for collisions so the IGW cannot be placed at their boundaries.
    if (typeof Collision !== 'undefined') {
      const igwObj = { type: 'circle', cx: model.CenterX, cy: model.CenterY, r: model.Radius };
      let collided = false;

      // Check against all shapes EXCEPT the host VPC itself and its ancestor containers
      const allShapes = CanvasState.getShapes();
      const ancestorIds = new Set();
      let currParentId = bestContainer.ShapeID;
      while (currParentId) {
        ancestorIds.add(currParentId);
        const pShape = allShapes.find(s => s.ShapeID === currParentId);
        currParentId = pShape ? pShape.ParentContainerID : null;
      }

      for (const s of allShapes) {
        if (ancestorIds.has(s.ShapeID)) continue;
        if (Collision.checkCollision(igwObj, _objFromShape(s))) {
          collided = true; break;
        }
      }

      // Check against existing COC circles (sibling IGWs on same or other VPCs)
      if (!collided) {
        const cocs = CircleOnContainerState.getAll();
        for (const coc of cocs) {
          const cocObj = { type: 'circle', cx: coc.CenterX, cy: coc.CenterY, r: coc.Radius };
          if (Collision.checkCollision(igwObj, cocObj)) {
            collided = true; break;
          }
        }
      }

      if (collided) {
        _showDropError('Internet Gateway cannot be placed here — it overlaps another shape boundary.');
        return;
      }
    }


    CircleOnContainerState.add(model);
    CircleOnContainerState.selectCircleOnContainer(model.CircleOnContainerID);

    if (typeof HistoryManager !== 'undefined') HistoryManager.recordState();
    if (typeof DirtyTracker   !== 'undefined') DirtyTracker.markDirty();
    if (typeof TemporaryActionFile !== 'undefined') TemporaryActionFile.update();
    RenderCanvas.render();

    console.log('[DropHandler] M8 Edge-attached:', model.Label, 'on', bestContainer.Label,
                'edge:', edgeResult.HostEdge, 't:', edgeResult.EdgeParameterT.toFixed(3));
  }

  // ── Collision helper for shapes (GeometryType-aware) ───────────────────────
  function _objFromShape(s) {
    const t    = (s.Type || 'rectangle').toLowerCase();
    const geom = (s.GeometryType || '').toLowerCase();
    if (t === 'line') {
      return { type: 'line', x1: s.WorldX - s.Width/2, y1: s.WorldY - s.Height/2,
               x2: s.WorldX + s.Width/2, y2: s.WorldY + s.Height/2 };
    }
    if (t === 'circle' || t === 'ellipse' || geom === 'circle') {
      return { type: 'circle', cx: s.WorldX, cy: s.WorldY, r: s.Radius ?? s.Width / 2 };
    }
    return { type: 'rectangle', x: s.WorldX - s.Width/2, y: s.WorldY - s.Height/2,
             width: s.Width, height: s.Height };
  }

  return { init, showError: _showDropError };

})();
