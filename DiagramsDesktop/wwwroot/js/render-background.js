/**
 * render-background.js
 * =====================
 */

'use strict';

const RenderBackground = (() => {

  const NS = "http://www.w3.org/2000/svg";

  function render(svg, canvas) {
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('width', '100%');
    rect.setAttribute('height', '100%');
    rect.setAttribute('fill', canvas.BackgroundColor);
    svg.appendChild(rect);
  }

  return { render };

})();
