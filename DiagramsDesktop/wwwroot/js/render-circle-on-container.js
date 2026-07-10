/**
 * render-circle-on-container.js
 * ==============================
 * Milestone 8 — Renders all Circle On Containers from CanvasState.
 *
 * Each COC is drawn as an opaque filled circle whose center lies exactly
 * on the host container's edge. The opaque fill visually occludes the
 * host container's dashed border line (BorderOcclusionPolicy = 'OpaqueFill').
 */

'use strict';

const RenderCircleOnContainer = (() => {

  const NS = 'http://www.w3.org/2000/svg';

  function render(svg, canvas, width, height) {
    const cocs      = CanvasState.getCircleOnContainers();
    if (!cocs || cocs.length === 0) return;

    const zoom       = canvas.ZoomScale;
    const selectedId = CircleOnContainerState.getSelectedId();
    const hoveredId  = CircleOnContainerState.getHoveredId();

    for (const coc of cocs) {
      const g = _buildCocGroup(coc, zoom, width, height, selectedId, hoveredId);
      svg.appendChild(g);
    }
  }

  function _buildCocGroup(coc, zoom, width, height, selectedId, hoveredId) {
    const pos = WorldToScreen.convert(coc.CenterX, coc.CenterY, width, height);
    const r   = coc.Radius * zoom;

    const isSelected = coc.CircleOnContainerID === selectedId;
    const isHovered  = coc.CircleOnContainerID === hoveredId && !isSelected;

    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'circle-on-container');
    g.setAttribute('data-coc-id', coc.CircleOnContainerID);

    // ── 1. Hover glow ring ──────────────────────────────────────
    if (isHovered) {
      const hoverRing = document.createElementNS(NS, 'circle');
      hoverRing.setAttribute('cx',           pos.x);
      hoverRing.setAttribute('cy',           pos.y);
      hoverRing.setAttribute('r',            r + 5 * zoom);
      hoverRing.setAttribute('fill',         'none');
      hoverRing.setAttribute('stroke',       '#93c5fd');
      hoverRing.setAttribute('stroke-width', 2 * zoom);
      hoverRing.setAttribute('stroke-dasharray', '4 3');
      hoverRing.setAttribute('class',        'circle-on-container__hover-ring');
      hoverRing.style.pointerEvents = 'none';
      g.appendChild(hoverRing);
    }

    // ── 2. Selection glow ring ──────────────────────────────────
    if (isSelected) {
      const selRing = document.createElementNS(NS, 'circle');
      selRing.setAttribute('cx',           pos.x);
      selRing.setAttribute('cy',           pos.y);
      selRing.setAttribute('r',            r + 4 * zoom);
      selRing.setAttribute('fill',         'none');
      selRing.setAttribute('stroke',       '#3b82f6');
      selRing.setAttribute('stroke-width', 2.5 * zoom);
      selRing.setAttribute('stroke-dasharray', '5 3');
      selRing.setAttribute('class',        'circle-on-container__selection-ring');
      selRing.style.pointerEvents = 'none';
      g.appendChild(selRing);
    }

    // ── 3. Main circle (opaque fill = border occlusion) ─────────
    const fillColor   = coc.FillColor  || '#8b5cf6';
    const strokeColor = coc.LineColor  || '#7c3aed';
    const strokeWidth = (coc.LineWidth ?? 2) * zoom;

    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx',           pos.x);
    circle.setAttribute('cy',           pos.y);
    circle.setAttribute('r',            r);
    circle.setAttribute('fill',         coc.FillType === 'NoFill' ? 'white' : fillColor);
    circle.setAttribute('fill-opacity', '1.0');  // opaque — occludes container border
    circle.setAttribute('stroke',       coc.LineType === 'NoLine' ? 'none' : strokeColor);
    circle.setAttribute('stroke-width', strokeWidth);
    circle.setAttribute('data-coc-id',  coc.CircleOnContainerID);
    circle.style.pointerEvents = 'all';
    g.appendChild(circle);

    // ── 4. Icon (if available) ───────────────────────────────────
    if (coc.SvgIcon) {
      _renderIcon(g, coc, pos, zoom, r);
    }

    // ── 5. Label ────────────────────────────────────────────────
    _renderLabel(g, coc, pos, zoom, r);

    // ── 6. Invisible hit area for easy clicking ─────────────────
    const hitArea = document.createElementNS(NS, 'circle');
    hitArea.setAttribute('cx',           pos.x);
    hitArea.setAttribute('cy',           pos.y);
    hitArea.setAttribute('r',            Math.max(r + 8 * zoom, 16 * zoom));
    hitArea.setAttribute('fill',         'transparent');
    hitArea.setAttribute('stroke',       'transparent');
    hitArea.style.cursor = 'move';
    hitArea.style.pointerEvents = 'all'; // Required to catch events when fill is transparent
    hitArea.setAttribute('data-coc-id', coc.CircleOnContainerID);

    // Direct mousedown — bypasses InputController path traversal entirely
    hitArea.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      // InputController (capture phase) fires BEFORE this bubble listener and may
      // have started PanHandler. Cancel it immediately so only COC move runs.
      if (typeof PanHandler !== 'undefined') PanHandler.cancel();
      CanvasState.selectShape(null);
      CircleOnContainerState.selectCircleOnContainer(coc.CircleOnContainerID);
      if (typeof MoveCircleOnContainer !== 'undefined') {
        MoveCircleOnContainer.beginMove(coc.CircleOnContainerID, e);
      }
      RenderCanvas.render();
    });

    hitArea.addEventListener('mouseenter', () => {
      CircleOnContainerState.hoverCircleOnContainer(coc.CircleOnContainerID);
      RenderCanvas.render();
    });

    hitArea.addEventListener('mouseleave', () => {
      if (CircleOnContainerState.getHoveredId() === coc.CircleOnContainerID) {
        CircleOnContainerState.hoverCircleOnContainer(null);
        RenderCanvas.render();
      }
    });

    g.appendChild(hitArea);

    // ── 7. Resize handles (when selected) ───────────────────────
    if (isSelected && coc.RadiusResizeEnabled) {
      _renderResizeHandles(g, coc, pos, zoom, r);
    }

    return g;
  }

  function _renderResizeHandles(g, coc, pos, zoom, r) {
    const handles = [
      { dx: 0,  dy: -r, code: 'n', cursor: 'n-resize' },
      { dx: 0,  dy:  r, code: 's', cursor: 's-resize' },
      { dx: -r, dy:  0, code: 'w', cursor: 'w-resize' },
      { dx:  r, dy:  0, code: 'e', cursor: 'e-resize' },
    ];

    for (const h of handles) {
      const hx = pos.x + h.dx;
      const hy = pos.y + h.dy;
      const size = 8 * zoom;

      const rect = document.createElementNS(NS, 'rect');
      rect.setAttribute('x',      hx - size / 2);
      rect.setAttribute('y',      hy - size / 2);
      rect.setAttribute('width',  size);
      rect.setAttribute('height', size);
      rect.setAttribute('rx',     2 * zoom);
      rect.setAttribute('ry',     2 * zoom);
      rect.setAttribute('fill',   '#ffffff');
      rect.setAttribute('stroke', '#94a3b8');
      rect.setAttribute('stroke-width', 1 * zoom);
      rect.setAttribute('class',  'coc-resize-handle');
      rect.setAttribute('data-parent-coc-id', coc.CircleOnContainerID);
      rect.setAttribute('data-handle-code', h.code);
      rect.style.cursor = h.cursor;

      g.appendChild(rect);
    }
  }

  function _renderIcon(g, coc, pos, zoom, r) {
    const parser   = new DOMParser();
    const doc      = parser.parseFromString(coc.SvgIcon, 'image/svg+xml');
    const svgEl    = doc.querySelector('svg');
    if (!svgEl) return;

    const gIcon = document.createElementNS(NS, 'g');
    gIcon.style.pointerEvents = 'none';

    let vbw = 40, vbh = 40;
    const viewBoxStr = svgEl.getAttribute('viewBox');
    if (viewBoxStr) {
      const parts = viewBoxStr.split(/[ ,]+/).map(parseFloat);
      if (parts.length === 4) {
        vbw = parts[2];
        vbh = parts[3];
      }
    }

    const maxVb    = Math.max(vbw, vbh);
    // Scale SVG to fill the full circle diameter — same formula as render-shapes.js circle geometry
    const diameter = r * 2;
    const scale    = diameter / maxVb;
    const tx = pos.x - ((vbw / 2) * scale);
    const ty = pos.y - ((vbh / 2) * scale);

    gIcon.setAttribute('transform', `translate(${tx}, ${ty}) scale(${scale})`);
    svgEl.childNodes.forEach(node => {
      if (node.nodeType === 1) gIcon.appendChild(node.cloneNode(true));
    });
    g.appendChild(gIcon);
  }

  function _renderLabel(g, coc, pos, zoom, r) {
    const text = document.createElementNS(NS, 'text');
    text.setAttribute('x', pos.x);
    text.setAttribute('y', pos.y + r + 14 * zoom);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#475569');
    text.style.fontFamily    = 'Inter, system-ui, sans-serif';
    text.style.fontSize      = (11 * zoom) + 'px';
    text.style.fontWeight    = '500';
    text.style.pointerEvents = 'none';
    text.textContent         = coc.Label || 'Internet Gateway';
    g.appendChild(text);
  }

  return { render };

})();
