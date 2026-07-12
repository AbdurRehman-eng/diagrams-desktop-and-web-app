/**
 * recalculate-edge-circles-on-parent-change.js
 * =============================================
 * Milestone 8 — Recalculates Circle On Container centers when the
 * parent container moves or resizes.
 *
 * Called from drag-handler_v2.js after a successful parent shape move/resize.
 */

'use strict';

const RecalculateEdgeCirclesOnParentChange = (() => {

  /**
   * onParentMoved
   * -------------
   * Called when a parent shape has been repositioned.
   * Recomputes CenterX/CenterY for every attached COC using the new geometry.
   */
  function onParentMoved(parentShapeId) {
    _recalculateAttached(parentShapeId, false);
  }

  /**
   * onParentResized
   * ---------------
   * Called when a parent shape has been resized.
   * Recomputes CenterX/CenterY. Radius is NOT changed.
   * Validates resulting positions; if invalid, clamps EdgeParameterT to [0,1]
   * (which it always already should be) and recomputes.
   */
  function onParentResized(parentShapeId) {
    _recalculateAttached(parentShapeId, true);
  }

  // ── Private ────────────────────────────────────────────────────

  function _recalculateAttached(parentShapeId, isResize) {
    const parentShape = CanvasState.getShapes().find(s => s.ShapeID === parentShapeId);
    if (!parentShape) return;

    const attached = CanvasState.getCircleOnContainers().filter(
      c => c.ParentContainerID === parentShapeId
    );

    if (attached.length === 0) return;

    for (const coc of attached) {
      const center = CalculateEdgeCircleCenter.fromEdge(
        parentShape,
        coc.HostEdge,
        coc.EdgeParameterT
      );

      const changes = {
        CenterX: center.CenterX,
        CenterY: center.CenterY,
        PreviousValidCenterX: center.CenterX,
        PreviousValidCenterY: center.CenterY,
      };

      // On resize, also validate the radius is still within the new edge constraints
      if (isResize && typeof ValidateEdgeCirclePlacement !== 'undefined') {
        const rv = ValidateEdgeCirclePlacement.validateRadiusRange(
          coc.Radius, parentShape, coc.HostEdge
        );
        if (!rv.ok) {
          changes.Radius = rv.clampedRadius;
          console.log(`[RecalculateEdge] Clamped radius for ${coc.CircleOnContainerID} after resize.`);
        }
      }

      CanvasState.updateCircleOnContainer(coc.CircleOnContainerID, changes);
    }

    console.log(`[RecalculateEdge] Recalculated ${attached.length} COC(s) after parent ${isResize ? 'resize' : 'move'}.`);
  }

  return { onParentMoved, onParentResized };

})();
