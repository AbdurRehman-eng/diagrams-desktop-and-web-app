/**
 * build-diagram-json.js
 * =====================
 */

'use strict';

const BuildDiagramJson = (() => {

  function build() {
    const diagram = CanvasState.getActiveDiagram();
    if (!diagram) return null;

    // Deep clone to avoid side effects
    const payload = JSON.parse(JSON.stringify(diagram));
    
    // Add export metadata
    payload.ExportedAt = new Date().toISOString();
    payload.EngineVersion = '2.0.0';

    return payload;
  }

  /**
   * buildFlatDto
   * ────────────
   * Returns a flat object structure matching Antitouch.Models.DiagramCanvasDto.
   * This is required for ASP.NET model binding since the Canvas properties 
   * are at the root level in the DTO, not nested.
   */
  function buildFlatDto() {
    const diagram = CanvasState.getActiveDiagram();
    if (!diagram) return null;

    const c = diagram.Canvas;

    return {
      // Root diagram fields
      DiagramID:      diagram.DiagramID,
      DiagramName:    diagram.DiagramName,
      DiagramVersion: diagram.DiagramVersion,

      // Canvas fields
      CanvasID:             c.CanvasID,
      CanvasName:           c.CanvasName,
      BackgroundColor:      c.BackgroundColor,
      CoordinateSystemType: c.CoordinateSystemType,
      OriginDefinition:     c.OriginDefinition,
      AxisOrientationX:     c.AxisOrientationX,
      AxisOrientationY:     c.AxisOrientationY,
      AxisOrientationZ:     c.AxisOrientationZ,
      IsInfiniteX:          c.IsInfiniteX,
      IsInfiniteY:          c.IsInfiniteY,
      IsInfiniteZ:          c.IsInfiniteZ,
      ViewportCenterX:      c.ViewportCenterX,
      ViewportCenterY:      c.ViewportCenterY,
      ViewportWidth:        c.ViewportWidth,
      ViewportHeight:       c.ViewportHeight,
      ZoomScale:            c.ZoomScale,
      GridVisible:          c.GridVisible,
      GridColor:            c.GridColor,
      GridSpacingX:         c.GridSpacingX,
      GridSpacingY:         c.GridSpacingY,
      ShowOriginMarker:     c.ShowOriginMarker,
      ShowAxes:             c.ShowAxes,
      PanEnabled:           c.PanEnabled,
      ZoomEnabled:          c.ZoomEnabled,
      TroubleshootingConsoleVisible: c.TroubleshootingConsoleVisible,

      // Shapes
      Shapes: (diagram.Shapes || []).map(s => ({ ...s, DiagramID: diagram.DiagramID })),

      // Connections
      Connections: (diagram.Connections || []).map(conn => ({ ...conn, DiagramID: diagram.DiagramID })),

      // CircleOnContainers (M8)
      CircleOnContainers: (diagram.CircleOnContainers || []).map(coc => ({ ...coc, DiagramID: diagram.DiagramID }))
    };
  }

  return { build, buildFlatDto };

})();
