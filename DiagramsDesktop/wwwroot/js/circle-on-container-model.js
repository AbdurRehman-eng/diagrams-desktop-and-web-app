/**
 * circle-on-container-model.js
 * ============================
 * Milestone 8 — Factory for CircleOnContainer committed model.
 */

'use strict';

const CircleOnContainerModel = (() => {

  /**
   * createCircleOnContainerModel
   * ----------------------------
   * Builds a fully normalized CircleOnContainer object from the given options.
   * CenterX/CenterY are calculated from HostEdge + EdgeParameterT by calling
   * CalculateEdgeCircleCenter, so they are always consistent.
   *
   * @param {object} opts
   * @param {string} opts.ParentContainerID  - ShapeID of the host rectangle container
   * @param {string} opts.DeviceOnContainerEdgeType - e.g. 'Internet Gateway'
   * @param {string} opts.HostEdge           - 'Top' | 'Right' | 'Bottom' | 'Left'
   * @param {number} opts.EdgeParameterT     - 0.0 .. 1.0
   * @param {number} opts.Radius             - initial radius
   * @param {object} [opts.appearance]       - optional overrides
   */
  function createCircleOnContainerModel(opts) {
    const gv = _getGlobalVars();

    const id = opts.CircleOnContainerID || ('coc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7));
    const diagramId = CanvasState.getActiveDiagram()?.DiagramID ?? 'unsaved';

    const t = Math.min(1, Math.max(0, opts.EdgeParameterT ?? 0.5));

    // Derive center from edge math
    const parentShape = CanvasState.getShapes().find(s => s.ShapeID === opts.ParentContainerID);
    const center = (parentShape && typeof CalculateEdgeCircleCenter !== 'undefined')
      ? CalculateEdgeCircleCenter.fromEdge(parentShape, opts.HostEdge, t)
      : { CenterX: 0, CenterY: 0 };

    // Derive ZOrder
    const parentZOrder = parentShape?.ZOrder ?? 0;

    const radius = opts.Radius ?? _defaultRadius(parentShape, opts.HostEdge, gv);

    return {
      CircleOnContainerID:          id,
      DiagramID:                    diagramId,
      ParentContainerID:            opts.ParentContainerID,
      DeviceOnContainerEdgeType:    opts.DeviceOnContainerEdgeType ?? 'Internet Gateway',
      ParentContainerType:          opts.ParentContainerType ?? 'VPC',

      HostEdge:                     opts.HostEdge,
      EdgeParameterT:               t,

      CenterX:                      center.CenterX,
      CenterY:                      center.CenterY,
      Radius:                       radius,

      ZOrder:                       parentZOrder + 1,

      FillType:                     opts.appearance?.FillType   ?? 'SolidFill',
      FillColor:                    opts.appearance?.FillColor   ?? '#8b5cf6',
      LineType:                     opts.appearance?.LineType   ?? 'SolidLine',
      LineColor:                    opts.appearance?.LineColor   ?? '#7c3aed',
      LineWidth:                    opts.appearance?.LineWidth   ?? 2,

      HoverPaddingRadiusRatio:      gv.hoverPaddingRadiusRatio      ?? 0.1,
      ProtectionPaddingRadiusRatio: gv.protectionPaddingRadiusRatio ?? 0.2,

      MovementEnabled:              true,
      CornerTransitionEnabled:      true,
      EdgePlacementPolicy:          'CenterOnBoundary',
      BorderOcclusionPolicy:        'OpaqueFill',

      RadiusResizeEnabled:          gv.resizeEnabled ?? true,
      MinimumRadiusRatio:           gv.minimumRadiusRatio ?? 0.10,
      MaximumRadiusRatio:           gv.maximumRadiusRatio ?? 0.20,

      // Previous-valid movement helpers (not persisted as committed truth)
      PreviousValidEdgeParameterT:  t,
      PreviousValidCenterX:         center.CenterX,
      PreviousValidCenterY:         center.CenterY,

      SvgIcon:                      opts.SvgIcon ?? null,
      Label:                        opts.Label   ?? 'Internet Gateway',

      CreatedAt: new Date().toISOString(),
      UpdatedAt: new Date().toISOString(),
    };
  }

  function _getGlobalVars() {
    if (typeof CanvasState !== 'undefined') {
      return CanvasState.getGlobalVars()?.circleOnContainer ?? {};
    }
    return {};
  }

  function _defaultRadius(parentShape, hostEdge, gv) {
    if (!parentShape) return 30;
    const edgeLen = _edgeLength(parentShape, hostEdge);
    const ratio = ((gv.minimumRadiusRatio ?? 0.10) + (gv.maximumRadiusRatio ?? 0.20)) / 2;
    return Math.max(15, edgeLen * ratio);
  }

  function _edgeLength(shape, hostEdge) {
    if (hostEdge === 'Top' || hostEdge === 'Bottom') return shape.Width;
    return shape.Height;
  }

  /**
   * validateCircleOnContainerModel
   * Returns { ok: true } or { ok: false, reason: string }
   */
  function validateCircleOnContainerModel(model) {
    if (!model.CircleOnContainerID) return { ok: false, reason: 'Missing CircleOnContainerID' };
    if (!model.ParentContainerID)   return { ok: false, reason: 'Missing ParentContainerID' };
    if (!['Top','Right','Bottom','Left'].includes(model.HostEdge))
      return { ok: false, reason: `Invalid HostEdge: ${model.HostEdge}` };
    if (model.EdgeParameterT < 0 || model.EdgeParameterT > 1)
      return { ok: false, reason: 'EdgeParameterT out of range' };
    if (model.Radius <= 0)
      return { ok: false, reason: 'Radius must be positive' };
    return { ok: true };
  }

  return { createCircleOnContainerModel, validateCircleOnContainerModel };

})();
