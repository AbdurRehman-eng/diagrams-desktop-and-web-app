/**
 * render-grid.js
 * ==============
 */

'use strict';

const RenderGrid = (() => {

  const NS = "http://www.w3.org/2000/svg";

  function render(svg, canvas, width, height) {
    const zoom = canvas.ZoomScale;
    const spacingX = canvas.GridSpacingX * zoom;
    const spacingY = canvas.GridSpacingY * zoom;
    
    // Find screen origin
    const origin = WorldToScreen.convert(0, 0, width, height);
    
    const color = canvas.GridColor;

    // Vertical lines
    let x = origin.x % spacingX;
    while (x < width) {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', height);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
      x += spacingX;
    }

    // Horizontal lines
    let y = origin.y % spacingY;
    while (y < height) {
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', width);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
      y += spacingY;
    }
  }

  return { render };

})();
