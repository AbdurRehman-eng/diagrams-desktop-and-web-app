/**
 * demo-diagram-builder.js
 * ========================
 * Milestone 9 — Builds the M9 reference demo diagram on startup
 * when no diagram is loaded.
 *
 * Structure:
 *   Region (root)
 *     └─ VPC
 *          ├─ IGW (on VPC right edge, COC)
 *          ├─ AZ-1 (left)
 *          │    └─ Subnet-1
 *          │         ├─ EC2
 *          │         ├─ Lambda
 *          │         ├─ Route Table
 *          │         └─ NAT Gateway (circle)
 *          └─ AZ-2 (right)
 *               └─ Subnet-2
 *                    ├─ EC2
 *                    ├─ Lambda
 *                    ├─ Route Table
 *                    └─ NAT Gateway (circle)
 * Connections:
 *   Subnet-1 ─ Route Table-1  (solid black)
 *   Subnet-2 ─ Route Table-2  (solid black)
 *   Route Table-1 ─ IGW       (solid black)
 *   Route Table-2 ─ IGW       (solid black)
 *   Route Table-1 ─ NAT-1     (solid black)
 *   Route Table-2 ─ NAT-2     (solid black)
 */

'use strict';

const DemoDiagramBuilder = (() => {

  console.log('[DemoDiagramBuilder] MODULE LOADED - Version M9.1');

  function _id(prefix) {
    return prefix + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  }

  function _shape(type, label, wx, wy, w, h, extra = {}) {
    const itemDef = (typeof ShapeCategories !== 'undefined')
      ? ShapeCategories.getItemByType(type) : null;

    const s = {
      ShapeID:     _id('shape'),
      DiagramID:   'demo-m9',
      Type:        type,
      Label:       label,
      WorldX:      wx,
      WorldY:      wy,
      Width:       w,
      Height:      h,
      Color:       itemDef?.fillColor   ?? '#6366f1',
      StrokeColor: itemDef?.strokeColor ?? '#6366f1',
      FillColor:   itemDef?.fillColor   ?? '#6366f1',
      SvgIcon:     itemDef?.svgIcon     ?? '',
      ZOrder:      0,
      ...extra,
    };
    if (itemDef?.geometryType)   s.GeometryType   = itemDef.geometryType;
    if (itemDef?.transparentFill) s.TransparentFill = true;
    if (s.GeometryType === 'circle' || s.Type === 'circle') {
      s.Radius = w / 2;
    }
    return s;
  }

  function _conn(id, fromId, toId, label) {
    return {
      ConnectionID:     id,
      DiagramID:        'demo-m9',
      FromShapeID:      fromId,
      ToShapeID:        toId,
      Label:            label,
      ConnectionType:   'No choices. Solid black line',
      LineStyle:        'solid',
      LineColor:        '#000000',
      LineWidth:        1.5,
      ArrowHead:        'none',
    };
  }

  function _coc(parentId, hostEdge, t, svgIcon, label) {
    if (typeof CircleOnContainerModel === 'undefined') return null;
    const parentShape = CanvasState.getShapes().find(s => s.ShapeID === parentId);
    if (!parentShape) return null;
    return CircleOnContainerModel.createCircleOnContainerModel({
      ParentContainerID:         parentId,
      ParentContainerType:       parentShape.Type,
      DeviceOnContainerEdgeType: label,
      HostEdge:                  hostEdge,
      EdgeParameterT:            t,
      SvgIcon:                   svgIcon,
      Label:                     label,
      appearance: { FillColor: '#f58536', LineColor: '#f58536' },
    });
  }

  /**
   * build
   * -----
   * Builds the diagram and applies it to CanvasState.
   * Only runs if the canvas has no shapes.
   */
  function build() {
    const existing = CanvasState.getShapes();
    if (existing && existing.length > 0) return; // Don't overwrite existing diagram

    const igwDef = (typeof ShapeCategories !== 'undefined')
      ? ShapeCategories.getItemByType('aws-igw') : null;

    // ── Shapes ──────────────────────────────────────────────────────────────

    // Region  (root, no parent)
    const region = _shape('aws-region', 'AWS Region', 0, 0, 900, 580);

    // VPC inside Region
    const vpc = _shape('aws-vpc', 'AWS VPC', 0, 0, 700, 460);
    vpc.ParentContainerID = region.ShapeID;

    // AZ-1 (left)
    const az1 = _shape('aws-availability-zone', 'AZ-1', -165, 0, 290, 380);
    az1.ParentContainerID = vpc.ShapeID;

    // AZ-2 (right)
    const az2 = _shape('aws-availability-zone', 'AZ-2',  165, 0, 290, 380);
    az2.ParentContainerID = vpc.ShapeID;

    // Subnet-1 inside AZ-1
    const sn1 = _shape('aws-subnet', 'Subnet-1', -165, 0, 240, 320);
    sn1.ParentContainerID = az1.ShapeID;

    // Subnet-2 inside AZ-2
    const sn2 = _shape('aws-subnet', 'Subnet-2',  165, 0, 240, 320);
    sn2.ParentContainerID = az2.ShapeID;

    // Items inside Subnet-1
    const ec2_1  = _shape('aws-ec2',         'EC2-1',     -200,  80, 55, 55);
    ec2_1.ParentContainerID  = sn1.ShapeID;
    const lam1   = _shape('aws-lambda',      'Lambda-1',  -130,  80, 55, 55);
    lam1.ParentContainerID   = sn1.ShapeID;
    const rt1    = _shape('aws-route-table', 'RouteTable-1', -165,  0, 110, 60);
    rt1.ParentContainerID    = sn1.ShapeID;
    const nat1   = _shape('aws-nat',         'NAT-1',     -165, -80, 55, 55);
    nat1.ParentContainerID   = sn1.ShapeID;
    nat1.Radius = 27.5;

    // Items inside Subnet-2
    const ec2_2  = _shape('aws-ec2',         'EC2-2',      130,  80, 55, 55);
    ec2_2.ParentContainerID  = sn2.ShapeID;
    const lam2   = _shape('aws-lambda',      'Lambda-2',   200,  80, 55, 55);
    lam2.ParentContainerID   = sn2.ShapeID;
    const rt2    = _shape('aws-route-table', 'RouteTable-2', 165,  0, 110, 60);
    rt2.ParentContainerID    = sn2.ShapeID;
    const nat2   = _shape('aws-nat',         'NAT-2',      165, -80, 55, 55);
    nat2.ParentContainerID   = sn2.ShapeID;
    nat2.Radius = 27.5;

    // Add all shapes to CanvasState
    const allShapes = [region, vpc, az1, az2, sn1, sn2,
                       ec2_1, lam1, rt1, nat1,
                       ec2_2, lam2, rt2, nat2];
    for (const s of allShapes) CanvasState.addShape(s);

    // ── IGW (Circle On Container on VPC right edge) ──────────────────────────
    if (igwDef && typeof CircleOnContainerModel !== 'undefined') {
      const igwModel = _coc(vpc.ShapeID, 'Right', 0.5, igwDef.svgIcon, 'AWS Internet Gateway');
      if (igwModel) {
        CircleOnContainerState.add(igwModel);
        // Store IGW ID for connections
        CanvasState._demoDiagramIgwId = igwModel.CircleOnContainerID;
        CanvasState._demoDiagramIgwCenterX = igwModel.CenterX;
        CanvasState._demoDiagramIgwCenterY = igwModel.CenterY;
      }
    }

    // ── Connections ──────────────────────────────────────────────────────────
    const conns = [
      _conn(_id('conn'), sn1.ShapeID,  rt1.ShapeID,  'Subnet1-RT1'),
      _conn(_id('conn'), sn2.ShapeID,  rt2.ShapeID,  'Subnet2-RT2'),
      _conn(_id('conn'), rt1.ShapeID,  vpc.ShapeID,  'RT1-IGW'),    // VPC as proxy for IGW connection
      _conn(_id('conn'), rt2.ShapeID,  vpc.ShapeID,  'RT2-IGW'),
      _conn(_id('conn'), rt1.ShapeID,  nat1.ShapeID, 'RT1-NAT1'),
      _conn(_id('conn'), rt2.ShapeID,  nat2.ShapeID, 'RT2-NAT2'),
    ];
    for (const c of conns) {
      if (!CanvasState.getActiveDiagram()) continue;
      CanvasState.getActiveDiagram().Connections.push(c);
    }

    if (typeof HistoryManager !== 'undefined') {
      HistoryManager.clear();
      HistoryManager.recordState();
    }
    if (typeof DirtyTracker !== 'undefined') DirtyTracker.markClean();

    console.log('[DemoDiagramBuilder] M9 demo diagram built successfully.');
    RenderCanvas.render();
  }

  return { build };

})();
