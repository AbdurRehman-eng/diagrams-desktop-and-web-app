/**
 * canvas-state_v2.js
 * ==================
 * Version M3.1 — Single source of truth for the active diagram.
 */

'use strict';

const CanvasState = (() => {

  console.log('[CanvasState] MODULE LOADED - Version M8.0');

  let activeDiagram        = null;
  let selectedShapeId      = null;
  let hoveredShapeId       = null;
  let selectedConnectionId = null;

  const _globalVars = {
    rectangle: {
      defaultFillColor:               '#6366f1',
      defaultStrokeColor:             '#6366f1',
      hoverPaddingRatio:              0.05,
      protectionPaddingRatio:         0.10,
      resizeControlPointDefaultColor: 'transparent',
      resizeControlPointHoverColor:   '#ffffff',
    },
    circle: {
      defaultFillColor:               '#6366f1',
      defaultStrokeColor:             '#6366f1',
      hoverPaddingRatio:              0.05,
      protectionPaddingRatio:         0.10,
      resizeControlPointDefaultColor: 'transparent',
      resizeControlPointHoverColor:   '#ffffff',
    },
    // ── M8: Circle On Container global defaults ────────────────
    circleOnContainer: {
      minimumRadiusRatio:           0.10,
      maximumRadiusRatio:           0.20,
      resizeEnabled:                true,
      hoverPaddingRadiusRatio:      0.10,
      protectionPaddingRadiusRatio: 0.20,
    },
  };

  function getGlobalVars() { return _globalVars; }

  function updateGlobalVar(type, changes) {
    if (!_globalVars[type]) return;
    if (changes.hoverPaddingRatio !== undefined && changes.protectionPaddingRatio !== undefined) {
      if (changes.protectionPaddingRatio <= changes.hoverPaddingRatio) return;
    }
    Object.assign(_globalVars[type], changes);
  }

  function initializeCanvasState(config = {}) {
    try {
      const c = config.Canvas || config;
      selectedShapeId = null;
      hoveredShapeId  = null;
      selectedConnectionId = null;
      // M8: reset COC state
      if (typeof CircleOnContainerState !== 'undefined') CircleOnContainerState.clearSelection();

      activeDiagram = {
        DiagramID:      config.DiagramID      || 'diagram-' + Date.now(),
        DiagramName:    config.DiagramName    || 'Untitled Diagram',
        DiagramVersion: config.DiagramVersion || 1,
        Canvas: {
          CanvasID:   c.CanvasID   || 'canvas-' + Date.now(),
          CanvasName: c.CanvasName || 'My Canvas',
          BackgroundColor:      c.BackgroundColor      || '#f1f5f9',
          CoordinateSystemType: c.CoordinateSystemType || 'Cartesian',
          OriginDefinition:     c.OriginDefinition     || 'Center',
          AxisOrientationX: c.AxisOrientationX || 'Right',
          AxisOrientationY: c.AxisOrientationY || 'Down',
          AxisOrientationZ: c.AxisOrientationZ || 'In',
          IsInfiniteX: c.IsInfiniteX !== undefined ? c.IsInfiniteX : true,
          IsInfiniteY: c.IsInfiniteY !== undefined ? c.IsInfiniteY : true,
          IsInfiniteZ: c.IsInfiniteZ !== undefined ? c.IsInfiniteZ : true,
          ViewportCenterX: c.ViewportCenterX !== undefined ? c.ViewportCenterX : 0,
          ViewportCenterY: c.ViewportCenterY !== undefined ? c.ViewportCenterY : 0,
          ViewportWidth:   c.ViewportWidth   || 2000,
          ViewportHeight:  c.ViewportHeight  || 2000,
          ZoomScale: c.ZoomScale || 1.0,
          GridVisible:  c.GridVisible  !== undefined ? c.GridVisible  : true,
          GridColor:    c.GridColor    || '#94a3b8',
          GridSpacingX: c.GridSpacingX || 25,
          GridSpacingY: c.GridSpacingY || 25,
          ShowOriginMarker: c.ShowOriginMarker !== undefined ? c.ShowOriginMarker : true,
          ShowAxes:         c.ShowAxes         !== undefined ? c.ShowAxes         : true,
          PanEnabled:  c.PanEnabled  !== undefined ? c.PanEnabled  : true,
          ZoomEnabled: c.ZoomEnabled !== undefined ? c.ZoomEnabled : true,
          TroubleshootingConsoleVisible: c.TroubleshootingConsoleVisible !== undefined ? c.TroubleshootingConsoleVisible : false,
        },
        Shapes: config.Shapes || [],
        Connections: config.Connections || [],
        CircleOnContainers: config.CircleOnContainers || [],
        SvgAssets: config.SvgAssets || [],
        SvgAttachments: config.SvgAttachments || []
      };
      return true;
    } catch (err) {
      console.error('[CanvasState] initializeCanvasState failed:', err);
      return false;
    }
  }

  function getActiveDiagram()      { return activeDiagram; }
  function getCanvas()             { return activeDiagram ? activeDiagram.Canvas : null; }
  function getShapes()             { return activeDiagram ? activeDiagram.Shapes : []; }
  function getSelectedId()         { return selectedShapeId; }
  function getHoveredId()          { return hoveredShapeId; }
  function getSelectedConnectionId() { return selectedConnectionId; }

  function selectShape(id) { 
    selectedShapeId = id; 
    if (id) {
      selectedConnectionId = null;
      // M8: Clear COC selection when a shape is selected
      if (typeof CircleOnContainerState !== 'undefined') {
        CircleOnContainerState.clearSelection();
      }
    }
  }
  function hoverShape(id)  { 
    hoveredShapeId  = id; 
    if (id && typeof CircleOnContainerState !== 'undefined') {
      CircleOnContainerState.hoverCircleOnContainer(null);
    }
  }

  function addShape(shape) {
    if (activeDiagram) activeDiagram.Shapes.push(shape);
  }

  // ── M8: Circle On Container CRUD ─────────────────────────────
  function getCircleOnContainers() {
    return activeDiagram ? activeDiagram.CircleOnContainers : [];
  }

  function addCircleOnContainer(model) {
    if (!activeDiagram) return;
    activeDiagram.CircleOnContainers.push(model);
    console.log('[CanvasState] M8 Added CircleOnContainer:', model.CircleOnContainerID);
  }

  function updateCircleOnContainer(id, changes) {
    if (!activeDiagram) return;
    const coc = activeDiagram.CircleOnContainers.find(c => c.CircleOnContainerID === id);
    if (coc) Object.assign(coc, changes);
  }

  function removeCircleOnContainer(id) {
    if (!activeDiagram) return;
    activeDiagram.CircleOnContainers = activeDiagram.CircleOnContainers.filter(
      c => c.CircleOnContainerID !== id
    );
  }

  function updateShape(shapeId, changes) {
    if (!activeDiagram) return;
    const shape = activeDiagram.Shapes.find(s => s.ShapeID === shapeId);
    if (shape) Object.assign(shape, changes);
  }

  function removeShape(shapeId) {
    if (!activeDiagram) return;
    activeDiagram.Shapes = activeDiagram.Shapes.filter(s => s.ShapeID !== shapeId);
  }

  function clearShapes() {
    if (activeDiagram) {
      activeDiagram.Shapes = [];
      activeDiagram.CircleOnContainers = [];
      activeDiagram.SvgAttachments = [];
      if (typeof CircleOnContainerState !== 'undefined') CircleOnContainerState.clearSelection();
    }
  }

  function selectConnection(id) { 
    selectedConnectionId = id; 
    if (id) selectedShapeId = null;
  }

  function removeConnection(connId) {
    if (!activeDiagram) return;
    activeDiagram.Connections = activeDiagram.Connections.filter(c => c.ConnectionID !== connId);
    if (selectedConnectionId === connId) selectedConnectionId = null;
    if (typeof DirtyTracker !== 'undefined') DirtyTracker.markDirty();
  }

  function updateCanvas(changes) {
    if (activeDiagram) Object.assign(activeDiagram.Canvas, changes);
  }

  function updateDiagramMeta(changes) {
    if (!activeDiagram) return;
    const allowed = ['DiagramID', 'DiagramName', 'DiagramVersion'];
    allowed.forEach(key => {
      if (changes[key] !== undefined) activeDiagram[key] = changes[key];
    });
  }

  return {
    initializeCanvasState,
    getActiveDiagram,
    getCanvas,
    getShapes,
    getSelectedId,
    getHoveredId,
    getSelectedConnectionId,
    getGlobalVars,
    updateGlobalVar,
    selectShape,
    hoverShape,
    selectConnection,
    addShape,
    updateShape,
    removeShape,
    removeConnection,
    clearShapes,
    updateCanvas,
    updateDiagramMeta,
    // M8
    getCircleOnContainers,
    addCircleOnContainer,
    updateCircleOnContainer,
    removeCircleOnContainer,
    // M12 SVG attachments
    getSvgAssets: () => (activeDiagram ? activeDiagram.SvgAssets : []),
    getSvgAttachments: () => (activeDiagram ? activeDiagram.SvgAttachments : []),
  };

})();
