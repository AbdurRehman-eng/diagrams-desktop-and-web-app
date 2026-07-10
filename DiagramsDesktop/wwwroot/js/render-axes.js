/**
 * render-axes.js
 * ==============
 */

'use strict';

const RenderAxes = (() => {

  const NS = "http://www.w3.org/2000/svg";

  function render(svg, canvas, width, height) {
    const origin = WorldToScreen.convert(0, 0, width, height);
    const color = '#94a3b8'; // Slate 400

    // X-Axis
    const xAxis = document.createElementNS(NS, 'line');
    xAxis.setAttribute('x1', 0);
    xAxis.setAttribute('y1', origin.y);
    xAxis.setAttribute('x2', width);
    xAxis.setAttribute('y2', origin.y);
    xAxis.setAttribute('stroke', color);
    xAxis.setAttribute('stroke-width', '2');
    svg.appendChild(xAxis);

    // Y-Axis
    const yAxis = document.createElementNS(NS, 'line');
    yAxis.setAttribute('x1', origin.x);
    yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', origin.x);
    yAxis.setAttribute('y2', height);
    yAxis.setAttribute('stroke', color);
    yAxis.setAttribute('stroke-width', '2');
    svg.appendChild(yAxis);
  }

  return { render };

})();
