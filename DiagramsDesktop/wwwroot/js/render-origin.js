/**
 * render-origin.js
 * ================
 */

'use strict';

const RenderOrigin = (() => {

  const NS = "http://www.w3.org/2000/svg";

  function render(svg, canvas, width, height) {
    const origin = WorldToScreen.convert(0, 0, width, height);

    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', origin.x);
    circle.setAttribute('cy', origin.y);
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', '#f43f5e'); // Rose 500
    circle.setAttribute('stroke', '#ffffff');
    circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);
    
    // Crosshair lines
    const hLine = document.createElementNS(NS, 'line');
    hLine.setAttribute('x1', origin.x - 12);
    hLine.setAttribute('y1', origin.y);
    hLine.setAttribute('x2', origin.x + 12);
    hLine.setAttribute('y2', origin.y);
    hLine.setAttribute('stroke', '#f43f5e');
    hLine.setAttribute('stroke-width', '1');
    svg.appendChild(hLine);

    const vLine = document.createElementNS(NS, 'line');
    vLine.setAttribute('x1', origin.x);
    vLine.setAttribute('y1', origin.y - 12);
    vLine.setAttribute('x2', origin.x);
    vLine.setAttribute('y2', origin.y + 12);
    vLine.setAttribute('stroke', '#f43f5e');
    vLine.setAttribute('stroke-width', '1');
    svg.appendChild(vLine);
  }

  return { render };

})();
