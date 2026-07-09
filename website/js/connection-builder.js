/**
 * connection-builder.js
 * =====================
 * Constructs the connection object and orchestrates saving to the backend
 * and adding to the local runtime state.
 */
'use strict';

const ConnectionBuilder = (() => {

  async function buildAndSave(sourceShapeId, destShapeId, connectionType) {
    console.log(`[ConnectionBuilder] Building connection ${connectionType} from ${sourceShapeId} to ${destShapeId}`);
    
    const config = typeof GlobalConnectionDefaults !== 'undefined' 
      ? GlobalConnectionDefaults.getDefaults(connectionType)
      : { StrokeColor: '#6366f1', LineType: 'solid', LineWidth: 2, DrawArrows: true };

    const diagramId = CanvasState.getActiveDiagram()?.DiagramID;
    
    // Generate a unique ID for the connection
    const connectionId = 'conn-' + Date.now();

    const payload = {
      ConnectionID: connectionId,
      DiagramID: diagramId,
      SourceItemID: sourceShapeId,
      SourceItemKind: 'Shape',
      DestinationItemID: destShapeId,
      DestinationItemKind: 'Shape',
      ConnectionType: connectionType,
      Detail: {
        LineType: config.DefaultLineType || config.LineType || 'solid',
        LineWidth: config.DefaultLineWidth || config.LineWidth || 2,
        LineColor: config.DefaultLineColor || config.StrokeColor || '#6366f1',
        IsDirectional: config.DrawArrows !== undefined ? config.DrawArrows : true,
        ConnectionRouteType: 'direct'
      }
    };

    // Optimistically add to state
    _addToState(payload);

    // Note: We deliberately do NOT immediately POST to /api/diagrams/{id}/connections here.
    // Doing so would cause a FOREIGN KEY constraint exception if the diagram hasn't been saved yet.
    // Instead, Connections are now fully serialized and persisted alongside Shapes
    // when the user explicitly clicks the "Save to DB" button.
    console.log('[ConnectionBuilder] Connection added to state. Will be persisted upon diagram save.');
    
    if (typeof DirtyTracker !== 'undefined') {
      DirtyTracker.markDirty();
    }
  }

  function _addToState(connectionObj) {
    const diagram = CanvasState.getActiveDiagram();
    if (!diagram) return;

    if (!diagram.Connections) {
      diagram.Connections = [];
    }
    
    diagram.Connections.push(connectionObj);
    console.log('[ConnectionBuilder] Added to CanvasState.Connections. Total:', diagram.Connections.length);

    // Trigger a re-render
    if (typeof RenderCanvas !== 'undefined') {
      RenderCanvas.render();
    }
  }

  return { buildAndSave };
})();
