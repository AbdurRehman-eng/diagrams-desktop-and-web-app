/**
 * render-connections.js
 * =====================
 * Responsible for rendering all connections in the diagram.
 */
'use strict';

const RenderConnections = (() => {

  const NS = 'http://www.w3.org/2000/svg';

  function render(svgLayer, canvasData, zoom, width, height) {
    if (!canvasData || !canvasData.Connections) return;

    const shapes = canvasData.Shapes || [];

    canvasData.Connections.forEach(conn => {
      const sourceShape = shapes.find(s => s.ShapeID === conn.SourceItemID)
        || canvasData.CircleOnContainers?.find(c => c.CircleOnContainerID === conn.SourceItemID);
      const destShape = shapes.find(s => s.ShapeID === conn.DestinationItemID)
        || canvasData.CircleOnContainers?.find(c => c.CircleOnContainerID === conn.DestinationItemID);

      if (!sourceShape || !destShape) return;

      const config = typeof GlobalConnectionDefaults !== 'undefined'
        ? GlobalConnectionDefaults.getDefaults(conn.ConnectionType)
        : { DefaultLineColor: '#6366f1', DefaultLineWidth: 2, DefaultLineType: 'solid', DrawArrows: true };

      // Override with specifics if they exist
      const details = conn.Detail || {};
      const strokeColor = details.LineColor || config.StrokeColor || '#6366f1';
      const lineWidth = (details.LineWidth || config.LineWidth || 2) * zoom;
      const lineType = details.LineType || config.LineType || 'solid';
      const drawArrows = details.IsDirectional !== undefined ? details.IsDirectional : (config.DrawArrows || false);

      let pathPoints = [];
      if (typeof ConnectionShortestPath !== 'undefined') {
        pathPoints = ConnectionShortestPath.computePath(sourceShape, destShape, config);
      } else {
        // Fallback
        pathPoints = [
          { x: sourceShape.WorldX, y: sourceShape.WorldY },
          { x: destShape.WorldX, y: destShape.WorldY }
        ];
      }

      if (pathPoints.length < 2) return;

      // Map to screen coordinates using WorldToScreen transformation
      const screenPoints = pathPoints.map(p => {
        if (typeof WorldToScreen !== 'undefined' && width && height) {
          return WorldToScreen.convert(p.x, p.y, width, height);
        }
        return { x: p.x * zoom, y: p.y * zoom };
      });

      // Determine how many lines to draw
      const typeLabel = (conn.ConnectionType || '').toLowerCase();
      let lineCount = 1;
      if (typeLabel.includes('two line') || typeLabel.includes('ipsec')) lineCount = 2;
      if (typeLabel.includes('three line')) lineCount = 3;
      if (typeLabel.includes('four line'))  lineCount = 4;

      const pathGroup = document.createElementNS(NS, 'g');
      pathGroup.setAttribute('class', 'diagram-connection');
      pathGroup.setAttribute('data-connection-id', conn.ConnectionID);
      pathGroup.dataset.connectionId = conn.ConnectionID;

      const spacing = 5 * zoom; // pixels between lines

      // ── M7: Selection & Hover State ──
      const isSelected = CanvasState.getSelectedConnectionId() === conn.ConnectionID;
      if (isSelected) {
        pathGroup.classList.add('selected');
      }

      // ── M7: Invisible Hit Area (makes clicking easy) ──
      const hitArea = document.createElementNS(NS, 'path');
      // Use the first line's path as the hit area base
      const firstLineD = _getPathData(_getOffsetPoints(screenPoints, _getOffset(0, lineCount, spacing)));
      hitArea.setAttribute('d', firstLineD);
      hitArea.setAttribute('stroke', 'transparent');
      hitArea.setAttribute('stroke-width', Math.max(20, lineWidth * 5));
      hitArea.setAttribute('fill', 'none');
      hitArea.style.cursor = 'pointer';
      hitArea.classList.add('connection-hit-area');
      
      // Events for selection
      hitArea.onclick = (e) => {
        e.stopPropagation();
        CanvasState.selectConnection(conn.ConnectionID);
        RenderCanvas.render();
      };
      pathGroup.appendChild(hitArea);

      for (let l = 0; l < lineCount; l++) {
        const offset = _getOffset(l, lineCount, spacing);
        const offsetPoints = _getOffsetPoints(screenPoints, offset);
        const d = _getPathData(offsetPoints);

        // Selection Highlight (Glow)
        if (isSelected) {
          const glow = document.createElementNS(NS, 'path');
          glow.setAttribute('d', d);
          glow.setAttribute('stroke', '#3b82f6');
          glow.setAttribute('stroke-width', lineWidth + (4 * zoom));
          glow.setAttribute('stroke-opacity', '0.4');
          glow.setAttribute('fill', 'none');
          pathGroup.appendChild(glow);
        }

        const pathLine = document.createElementNS(NS, 'path');
        pathLine.setAttribute('d', d);
        pathLine.setAttribute('stroke', strokeColor);
        pathLine.setAttribute('stroke-width', lineWidth);
        pathLine.setAttribute('fill', 'none');
        pathLine.classList.add('connection-line-path');

        if (lineType === 'dashed') {
          pathLine.setAttribute('stroke-dasharray', `${6 * zoom},${4 * zoom}`);
        } else if (lineType === 'dotted') {
          pathLine.setAttribute('stroke-dasharray', `${2 * zoom},${4 * zoom}`);
          pathLine.setAttribute('stroke-linecap', 'round');
        }
        pathGroup.appendChild(pathLine);
      }

      // ── M7: Delete Button at Midpoint ──
      if (isSelected) {
        const midIdx = Math.floor(screenPoints.length / 2);
        const midP = screenPoints[midIdx];
        
        const delBtn = document.createElementNS(NS, 'g');
        delBtn.classList.add('connection-delete-btn');
        delBtn.style.cursor = 'pointer';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          CanvasState.removeConnection(conn.ConnectionID);
          RenderCanvas.render();
        };

        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', midP.x);
        circle.setAttribute('cy', midP.y);
        circle.setAttribute('r', 10 * zoom);
        circle.setAttribute('fill', '#f43f5e');
        delBtn.appendChild(circle);

        const text = document.createElementNS(NS, 'text');
        text.setAttribute('x', midP.x);
        text.setAttribute('y', midP.y + (4 * zoom));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-size', 12 * zoom);
        text.setAttribute('font-weight', 'bold');
        text.textContent = '✕';
        delBtn.appendChild(text);

        pathGroup.appendChild(delBtn);
      }

      // Arrowhead
      if (drawArrows) {
        const lastP = screenPoints[screenPoints.length - 1];
        const prevP = screenPoints[screenPoints.length - 2];
        const angle = Math.atan2(lastP.y - prevP.y, lastP.x - prevP.x);
        
        const arrowSize = 10 * zoom;
        const arrowP1 = {
          x: lastP.x - arrowSize * Math.cos(angle - Math.PI / 6),
          y: lastP.y - arrowSize * Math.sin(angle - Math.PI / 6)
        };
        const arrowP2 = {
          x: lastP.x - arrowSize * Math.cos(angle + Math.PI / 6),
          y: lastP.y - arrowSize * Math.sin(angle + Math.PI / 6)
        };

        const arrowPath = document.createElementNS(NS, 'polygon');
        arrowPath.setAttribute('points', `${lastP.x},${lastP.y} ${arrowP1.x},${arrowP1.y} ${arrowP2.x},${arrowP2.y}`);
        arrowPath.setAttribute('fill', strokeColor);
        pathGroup.appendChild(arrowPath);
      }

      svgLayer.appendChild(pathGroup);
    });
  }

  // ── Helpers ──
  function _getOffset(l, lineCount, spacing) {
    if (lineCount === 2) return (l === 0) ? -spacing/2 : spacing/2;
    if (lineCount === 3) return (l - 1) * spacing;
    if (lineCount === 4) return (l - 1.5) * spacing;
    return 0;
  }

  function _getOffsetPoints(points, offset) {
    if (offset === 0) return points;
    const p1 = points[0];
    const p2 = points[1] || p1;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx*dx + dy*dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    return points.map(p => ({ x: p.x + nx * offset, y: p.y + ny * offset }));
  }

  function _getPathData(points) {
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
  }

  return { render };

})();
