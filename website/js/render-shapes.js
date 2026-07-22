/**
 * render-shapes.js
 * ================
 * Version M3.0 / M5.0
 *
 * M5.0 changes:
 *  - Resize handles now render on HOVER (not just selection).
 *  - Handles use GlobalVars resizeControlPointDefaultColor (transparent by default)
 *    and resizeControlPointHoverColor (white) for active/hover state.
 *  - 8 control points for rectangles: NW, N, NE, E, SE, S, SW, W.
 *  - 2 control points for circles: N, S (uniform radius drag).
 *  - Hover outline ring rendered distinct from selection outline.
 *  - Selection and hover states are independent — selected shape always shows handles.
 */

'use strict';

const RenderShapes = (() => {

  const NS = 'http://www.w3.org/2000/svg';

  function render(svg, canvas, width, height) {
    const shapes     = CanvasState.getShapes();
    const zoom       = canvas.ZoomScale;
    const selectedId = CanvasState.getSelectedId();
    const hoveredId  = CanvasState.getHoveredId();

    shapes.forEach(shape => {
      const pos        = WorldToScreen.convert(shape.WorldX, shape.WorldY, width, height);
      const isSelected = (shape.ShapeID === selectedId);
      const isHovered  = (shape.ShapeID === hoveredId) && !isSelected;
      const g          = _buildShapeGroup(shape, pos, zoom, isSelected, isHovered);
      svg.appendChild(g);
    });
  }

  function _buildShapeGroup(shape, pos, zoom, isSelected, isHovered) {
    const g = document.createElementNS(NS, 'g');
    g.id            = shape.ShapeID;
    g.style.cursor  = 'move';
    g.dataset.objId = shape.ShapeID;

    const type = (shape.Type || 'rectangle').toLowerCase();

    // Determine effective geometry — GeometryType stored on shape overrides type inference.
    // This makes aws-nat render as a circle (M3), aws-ec2/aws-route-table as rects (M2).
    const effectiveGeom = shape.GeometryType ??
      (['circle', 'ellipse'].includes(type) ? 'circle' : type === 'line' ? 'line' : 'rectangle');

    // 1. Geometry (Milestone 2 rect / Milestone 3 circle / line)
    switch (effectiveGeom) {
      case 'line':
        _renderLine(g, shape, pos, zoom, isSelected);
        break;
      case 'circle':
        _renderCircle(g, shape, pos, zoom, isSelected, isHovered);
        break;
      default:
        _renderRect(g, shape, pos, zoom, isSelected, isHovered, type);
    }

    // 2. Icon (Nested SVG — non-primitives only)
    if (shape.SvgIcon) {
      _renderIcon(g, shape, pos, zoom, effectiveGeom);
    }

    // 3. Resize Handles — show on hover OR selection
    if (isSelected || isHovered) {
      _renderHandles(g, shape, pos, zoom, type, isSelected || isHovered, effectiveGeom);
    }

    // 4. Label
    _renderLabel(g, shape, pos, zoom, type, effectiveGeom);

    return g;
  }

  // ── Rectangle ────────────────────────────────────────────────
  function _renderRect(g, shape, pos, zoom, isSelected, isHovered, type) {
    const w = shape.Width  * zoom;
    const h = shape.Height * zoom;

    let fillOpacity = '1.0';
    let rx = 0;
    let strokeDash = 'none';

    if (type === 'aws-region' || type === 'aws-vpc' || type === 'aws-availability-zone' || type === 'aws-subnet') {
       fillOpacity = '0.08';
       rx = 4 * zoom;
       strokeDash = `${6 * zoom} ${4 * zoom}`;
    } else if (shape.TransparentFill) {
       // EC2, Lambda and similar: transparent background, keep border for selection
       fillOpacity = '0.0';
    }

    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('x',            pos.x - w / 2);
    rect.setAttribute('y',            pos.y - h / 2);
    rect.setAttribute('width',        w);
    rect.setAttribute('height',       h);
    rect.setAttribute('fill',         shape.FillColor || shape.Color || '#6366f1');
    rect.setAttribute('fill-opacity', fillOpacity);
    rect.setAttribute('rx',           rx);
    rect.setAttribute('ry',           rx);
    rect.setAttribute('stroke',       shape.TransparentFill ? 'none' : (shape.StrokeColor || shape.Color || '#6366f1'));
    rect.setAttribute('stroke-width', 1.5 * zoom);
    if (strokeDash !== 'none') {
      rect.setAttribute('stroke-dasharray', strokeDash);
    }
    g.appendChild(rect);

    // Hover outline (subtle blue ring)
    if (isHovered) {
      const outline = document.createElementNS(NS, 'rect');
      outline.setAttribute('x',      pos.x - w / 2 - 3);
      outline.setAttribute('y',      pos.y - h / 2 - 3);
      outline.setAttribute('width',  w + 6);
      outline.setAttribute('height', h + 6);
      outline.setAttribute('fill',   'none');
      outline.setAttribute('stroke', '#93c5fd');
      outline.setAttribute('stroke-width', 1.5 * zoom);
      outline.setAttribute('stroke-dasharray', '4 3');
      outline.style.pointerEvents = 'none';
      g.appendChild(outline);
    }

    // Selection outline (solid blue)
    if (isSelected) {
      const outline = document.createElementNS(NS, 'rect');
      outline.setAttribute('x',      pos.x - w / 2 - 2);
      outline.setAttribute('y',      pos.y - h / 2 - 2);
      outline.setAttribute('width',  w + 4);
      outline.setAttribute('height', h + 4);
      outline.setAttribute('fill',   'none');
      outline.setAttribute('stroke', '#3b82f6');
      outline.setAttribute('stroke-width', 2 * zoom);
      outline.setAttribute('stroke-dasharray', '5 3');
      outline.style.pointerEvents = 'none';
      g.appendChild(outline);
    }
  }

  // ── Circle / Ellipse ─────────────────────────────────────────
  function _renderCircle(g, shape, pos, zoom, isSelected, isHovered) {
    const radius = shape.Radius ?? (shape.Width / 2);
    const rx = radius * zoom;
    const ry = radius * zoom;

    const el = document.createElementNS(NS, 'ellipse');
    el.setAttribute('cx',           pos.x);
    el.setAttribute('cy',           pos.y);
    el.setAttribute('rx',           rx);
    el.setAttribute('ry',           ry);
    el.setAttribute('fill',         shape.FillColor || shape.Color || '#6366f1');
    el.setAttribute('fill-opacity', shape.TransparentFill ? '0' : '1.0');
    el.setAttribute('stroke',       shape.TransparentFill ? 'none' : (shape.StrokeColor || shape.Color || '#6366f1'));
    el.setAttribute('stroke-width', 1.5 * zoom);
    g.appendChild(el);

    if (isHovered) {
      const outline = document.createElementNS(NS, 'ellipse');
      outline.setAttribute('cx',     pos.x);
      outline.setAttribute('cy',     pos.y);
      outline.setAttribute('rx',     rx + 3);
      outline.setAttribute('ry',     ry + 3);
      outline.setAttribute('fill',   'none');
      outline.setAttribute('stroke', '#93c5fd');
      outline.setAttribute('stroke-width', 1.5 * zoom);
      outline.setAttribute('stroke-dasharray', '4 3');
      outline.style.pointerEvents = 'none';
      g.appendChild(outline);
    }

    if (isSelected) {
      const outline = document.createElementNS(NS, 'ellipse');
      outline.setAttribute('cx',     pos.x);
      outline.setAttribute('cy',     pos.y);
      outline.setAttribute('rx',     rx + 2);
      outline.setAttribute('ry',     ry + 2);
      outline.setAttribute('fill',   'none');
      outline.setAttribute('stroke', '#ef4444');
      outline.setAttribute('stroke-width', 1.5 * zoom);
      outline.setAttribute('stroke-dasharray', '4 2');
      outline.style.pointerEvents = 'none';
      g.appendChild(outline);
    }
  }

  // ── Line ─────────────────────────────────────────────────────
  function _renderLine(g, shape, pos, zoom, isSelected) {
    const hw = (shape.Width  / 2) * zoom;
    const hh = (shape.Height / 2) * zoom;

    const line = document.createElementNS(NS, 'line');
    line.setAttribute('x1',            pos.x - hw);
    line.setAttribute('y1',            pos.y - hh);
    line.setAttribute('x2',            pos.x + hw);
    line.setAttribute('y2',            pos.y + hh);
    line.setAttribute('stroke',        shape.StrokeColor || shape.Color || '#10b981');
    line.setAttribute('stroke-width',  2.5 * zoom);
    line.setAttribute('stroke-linecap','round');
    g.appendChild(line);

    if (isSelected) {
      const outline = document.createElementNS(NS, 'line');
      outline.setAttribute('x1', pos.x - hw);
      outline.setAttribute('y1', pos.y - hh);
      outline.setAttribute('x2', pos.x + hw);
      outline.setAttribute('y2', pos.y + hh);
      outline.setAttribute('stroke',         '#3b82f6');
      outline.setAttribute('stroke-width',   4.5 * zoom);
      outline.setAttribute('stroke-opacity', '0.4');
      outline.setAttribute('stroke-linecap', 'round');
      outline.style.pointerEvents = 'none';
      g.appendChild(outline);
    }

    // Wide transparent hit area
    const hitArea = document.createElementNS(NS, 'line');
    hitArea.setAttribute('x1',           pos.x - hw);
    hitArea.setAttribute('y1',           pos.y - hh);
    hitArea.setAttribute('x2',           pos.x + hw);
    hitArea.setAttribute('y2',           pos.y + hh);
    hitArea.setAttribute('stroke',       'transparent');
    hitArea.setAttribute('stroke-width', 24 * zoom);
    hitArea.style.pointerEvents = 'stroke';
    g.appendChild(hitArea);
  }

  // ── Resize / Endpoint Handles ────────────────────────────────
  /**
   * isSelected controls control point color:
   *   selected or hovered → use resizeControlPointHoverColor (white)
   *   hover only         → also show white (so hovering reveals the points)
   *   default (invisible)→ use resizeControlPointDefaultColor (transparent)
   *
   * For rectangles: 8 handles (NW, N, NE, E, SE, S, SW, W).
   * For circles:    2 handles (N, S) — radius is uniform.
   * For lines:      2 endpoint handles (P1, P2).
   */
  function _renderHandles(g, shape, pos, zoom, type, isSelected, effectiveGeom) {
    const gv = CanvasState.getGlobalVars();

    if (type === 'line') {
      const hw = (shape.Width  / 2) * zoom;
      const hh = (shape.Height / 2) * zoom;
      _createHandle(g, pos.x - hw, pos.y - hh, 'p1', 'pointer',  zoom, true);
      _createHandle(g, pos.x + hw, pos.y + hh, 'p2', 'pointer',  zoom, true);
      return;
    }

    const isCircleGeom = (effectiveGeom === 'circle');
    const gvType   = isCircleGeom ? gv.circle : gv.rectangle;
    const activeFill = gvType.resizeControlPointHoverColor;

    if (isCircleGeom) {
      const radius = (shape.Radius ?? (shape.Width / 2)) * zoom;
      _createHandle(g, pos.x,          pos.y - radius, 'n', 'n-resize', zoom, isSelected, activeFill);
      _createHandle(g, pos.x,          pos.y + radius, 's', 's-resize', zoom, isSelected, activeFill);
      _createHandle(g, pos.x - radius, pos.y,          'w', 'w-resize', zoom, isSelected, activeFill);
      _createHandle(g, pos.x + radius, pos.y,          'e', 'e-resize', zoom, isSelected, activeFill);
    } else {
      const w = shape.Width  * zoom;
      const h = shape.Height * zoom;
      const l = pos.x - w / 2, r = pos.x + w / 2, mid = pos.x;
      const t = pos.y - h / 2, b = pos.y + h / 2, midy = pos.y;
      _createHandle(g, l,   t,    'nw', 'nwse-resize', zoom, isSelected, activeFill);
      _createHandle(g, mid, t,    'n',  'ns-resize',   zoom, isSelected, activeFill);
      _createHandle(g, r,   t,    'ne', 'nesw-resize', zoom, isSelected, activeFill);
      _createHandle(g, r,   midy, 'e',  'ew-resize',   zoom, isSelected, activeFill);
      _createHandle(g, r,   b,    'se', 'nwse-resize', zoom, isSelected, activeFill);
      _createHandle(g, mid, b,    's',  'ns-resize',   zoom, isSelected, activeFill);
      _createHandle(g, l,   b,    'sw', 'nesw-resize', zoom, isSelected, activeFill);
      _createHandle(g, l,   midy, 'w',  'ew-resize',   zoom, isSelected, activeFill);
    }
  }

  function _createHandle(g, x, y, handleCode, cursor, zoom, isActive, activeFill = '#ffffff') {
    const size = 9 * zoom;
    const h    = document.createElementNS(NS, 'rect');
    h.setAttribute('x',      x - size / 2);
    h.setAttribute('y',      y - size / 2);
    h.setAttribute('width',  size);
    h.setAttribute('height', size);
    h.setAttribute('rx',     2 * zoom);
    h.setAttribute('ry',     2 * zoom);
    // Transparent by default; white when active (hovered or selected)
    h.setAttribute('fill',         isActive ? activeFill : 'transparent');
    h.setAttribute('stroke',       isActive ? '#94a3b8'  : 'transparent');
    h.setAttribute('stroke-width', 1 * zoom);
    h.setAttribute('data-handle',  handleCode);
    h.style.cursor        = cursor;
    h.style.pointerEvents = 'all';
    g.appendChild(h);
  }

  // ── Icon ────────────────────────────────────────────────
  // effectiveGeom: 'circle' | 'rectangle' | 'line'
  function _renderIcon(g, shape, pos, zoom, effectiveGeom) {
    const typeString = (shape.Type || 'rectangle').toLowerCase();
    const noIcon = [
      'line', 'circle', 'rectangle', 'rect', 'ellipse', 'cylinder', 'database',
      'aws-region', 'aws-vpc', 'aws-availability-zone'
    ];
    if (noIcon.includes(typeString)) return;

    const parser     = new DOMParser();
    const doc        = parser.parseFromString(shape.SvgIcon, 'image/svg+xml');
    const svgContent = doc.querySelector('svg');
    if (!svgContent) return;

    const gIcon = document.createElementNS(NS, 'g');
    gIcon.style.pointerEvents = 'none';

    // Parse SVG viewBox
    let vbw = 40, vbh = 40;
    const viewBoxStr = svgContent.getAttribute('viewBox');
    if (viewBoxStr) {
      const parts = viewBoxStr.split(/[ ,]+/).map(parseFloat);
      if (parts.length === 4) { vbw = parts[2]; vbh = parts[3]; }
    }

    if (effectiveGeom === 'circle') {
      // ── Circle geometry: scale SVG to fill the full circle diameter ────────
      // Same variable as the circle: radius. SVG fills diameter = radius * 2.
      const radius   = (shape.Radius ?? (shape.Width / 2)) * zoom;
      const diameter = radius * 2;
      const maxVb    = Math.max(vbw, vbh);
      const scale    = diameter / maxVb;          // uniform — preserves SVG proportions
      const tx = pos.x - (vbw / 2) * scale;
      const ty = pos.y - (vbh / 2) * scale;
      gIcon.setAttribute('transform', `translate(${tx}, ${ty}) scale(${scale})`);
    } else {
      // ── Rectangle geometry: non-uniform scale so SVG fills exact Width × Height ──
      // Same variables as the rectangle: Width and Height.
      // When the user resizes the rect, Width/Height change → SVG redraws to match.
      const W      = shape.Width  * zoom;
      const H      = shape.Height * zoom;
      const scaleX = W / vbw;
      const scaleY = H / vbh;
      const tx     = pos.x - W / 2;   // top-left corner x
      const ty     = pos.y - H / 2;   // top-left corner y
      gIcon.setAttribute('transform', `translate(${tx}, ${ty}) scale(${scaleX}, ${scaleY})`);
    }

    svgContent.childNodes.forEach(node => {
      if (node.nodeType === 1 && node.getAttribute('opacity') !== '0.1') {
        gIcon.appendChild(node.cloneNode(true));
      }
    });
    g.appendChild(gIcon);
  }

  // ── Label ──────────────────────────────────────────────
  function _renderLabel(g, shape, pos, zoom, type, effectiveGeom) {
    const text = document.createElementNS(NS, 'text');
    let yOff = 0;
    let xOff = 0;
    let textAnchor = 'middle';

    if (effectiveGeom === 'circle') {
      // Circle-geometry AWS shapes: label centered below the circle
      const radius = (shape.Radius ?? (shape.Width / 2)) * zoom;
      yOff = radius + 14 * zoom;
    } else if (type.startsWith('aws-')) {
      // Rectangle-geometry AWS shapes: top-left inner corner
      yOff = -(shape.Height / 2 * zoom) + 16 * zoom;
      xOff = -(shape.Width  / 2 * zoom) + 10 * zoom;
      textAnchor = 'start';
    } else if (type === 'line') {
      yOff = Math.abs(shape.Height / 2) * zoom + 16 * zoom;
    } else {
      yOff = (shape.Height * zoom) / 2 + 16 * zoom;
    }

    text.setAttribute('x', pos.x + xOff);
    text.setAttribute('y', pos.y + yOff);
    text.setAttribute('text-anchor', textAnchor);
    text.setAttribute('fill', '#475569');
    text.style.fontFamily    = 'Inter, system-ui, sans-serif';
    text.style.fontSize      = (12 * zoom) + 'px';
    text.style.fontWeight    = '500';
    text.style.pointerEvents = 'none';
    text.textContent = shape.Label;
    g.appendChild(text);
  }

  return { render };

})();
