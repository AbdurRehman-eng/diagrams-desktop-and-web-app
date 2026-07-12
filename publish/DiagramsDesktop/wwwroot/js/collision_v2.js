/**
 * diagram-canvas-collision.js
 * ===========================
 * Collision detection module for diagram shapes.
 * Rejects boundaries touching or crossing.
 * Allows pure containment (one shape entirely inside another).
 */

'use strict';

const Collision = (() => {

  // Helper: Get distance squared
  function _dist2(x1, y1, x2, y2) {
    return (x2 - x1) ** 2 + (y2 - y1) ** 2;
  }

  // Helper: Clamp value
  function _clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // Helper: check if two line segments (x1,y1)-(x2,y2) and (x3,y3)-(x4,y4) intersect
  function _lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (den === 0) return false; // collinear or parallel
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / den;
    // t and u are between 0 and 1 means they intersect
    // If they equal 0 or 1, they touch end points, which is also a collision
    return t >= 0 && t <= 1 && u >= 0 && u <= 1;
  }

  function rectIntersectsRect(r1, r2) {
    const overlap = r1.x <= r2.x + r2.width &&
                    r1.x + r1.width >= r2.x &&
                    r1.y <= r2.y + r2.height &&
                    r1.y + r1.height >= r2.y;
    return overlap;
  }

  function circleIntersectsCircle(c1, c2) {
    const d2 = _dist2(c1.cx, c1.cy, c2.cx, c2.cy);
    const sumR = c1.r + c2.r;
    return d2 <= sumR * sumR;
  }

  function circleIntersectsRect(c, r) {
    const px = _clamp(c.cx, r.x, r.x + r.width);
    const py = _clamp(c.cy, r.y, r.y + r.height);
    const overlap = _dist2(c.cx, c.cy, px, py) <= c.r ** 2;
    return overlap;
  }

  function lineIntersectsLineObj(l1, l2) {
    return _lineIntersectsLine(l1.x1, l1.y1, l1.x2, l1.y2, l2.x1, l2.y1, l2.x2, l2.y2);
  }

  function lineIntersectsRect(l, r) {
    const p1Inside = l.x1 > r.x && l.x1 < r.x + r.width && l.y1 > r.y && l.y1 < r.y + r.height;
    const p2Inside = l.x2 > r.x && l.x2 < r.x + r.width && l.y2 > r.y && l.y2 < r.y + r.height;
    if (p1Inside && p2Inside) return false; // fully inside -> no border crossing

    const e1 = _lineIntersectsLine(l.x1, l.y1, l.x2, l.y2, r.x, r.y, r.x + r.width, r.y);
    const e2 = _lineIntersectsLine(l.x1, l.y1, l.x2, l.y2, r.x, r.y + r.height, r.x + r.width, r.y + r.height);
    const e3 = _lineIntersectsLine(l.x1, l.y1, l.x2, l.y2, r.x, r.y, r.x, r.y + r.height);
    const e4 = _lineIntersectsLine(l.x1, l.y1, l.x2, l.y2, r.x + r.width, r.y, r.x + r.width, r.y + r.height);

    return e1 || e2 || e3 || e4;
  }

  function lineIntersectsCircle(l, c) {
    const p1Dist2 = _dist2(l.x1, l.y1, c.cx, c.cy);
    const p2Dist2 = _dist2(l.x2, l.y2, c.cx, c.cy);
    
    if (p1Dist2 < c.r**2 && p2Dist2 < c.r**2) return false; // completely inside

    const dx = l.x2 - l.x1;
    const dy = l.y2 - l.y1;
    const lenSq = dx * dx + dy * dy;
    
    if (lenSq === 0) return _dist2(l.x1, l.y1, c.cx, c.cy) <= c.r ** 2;

    let t = ((c.cx - l.x1) * dx + (c.cy - l.y1) * dy) / lenSq;
    t = _clamp(t, 0, 1);

    const closestX = l.x1 + t * dx;
    const closestY = l.y1 + t * dy;

    return _dist2(c.cx, c.cy, closestX, closestY) <= c.r ** 2;
  }

  function checkCollision(shapeA, shapeB) {
    const tA = shapeA.type;
    const tB = shapeB.type;

    if (tA === 'rectangle' && tB === 'rectangle') return rectIntersectsRect(shapeA, shapeB);
    if (tA === 'circle' && tB === 'circle') return circleIntersectsCircle(shapeA, shapeB);
    
    if (tA === 'circle' && tB === 'rectangle') return circleIntersectsRect(shapeA, shapeB);
    if (tA === 'rectangle' && tB === 'circle') return circleIntersectsRect(shapeB, shapeA);

    if (tA === 'line' && tB === 'line') return lineIntersectsLineObj(shapeA, shapeB);

    if (tA === 'line' && tB === 'rectangle') return lineIntersectsRect(shapeA, shapeB);
    if (tA === 'rectangle' && tB === 'line') return lineIntersectsRect(shapeB, shapeA);

    if (tA === 'line' && tB === 'circle') return lineIntersectsCircle(shapeA, shapeB);
    if (tA === 'circle' && tB === 'line') return lineIntersectsCircle(shapeB, shapeA);

    return false;
  }

  return { checkCollision };

})();
