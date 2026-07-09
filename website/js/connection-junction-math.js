/**
 * connection-junction-math.js
 * ===========================
 * Calculates the junction points on the perimeter of shapes for drawing connections.
 * 
 * Supports Rectangles (and square-like shapes) and Circles, utilizing the
 * TargetRadiusPaddingRatio defined in GlobalConnectionDefaults.
 */
'use strict';

const ConnectionJunctionMath = (() => {

  /**
   * Calculates the intersection point on the edge of the shape from the center.
   * 
   * @param {Object} shape - The DiagramShape object.
   * @param {number} targetX - X coordinate of the other end.
   * @param {number} targetY - Y coordinate of the other end.
   * @param {number} paddingRatio - Multiplier for padding (e.g., 1.1 for 10% padding).
   * @returns {Object} { x, y } point on the boundary.
   */
  function calculateJunctionPoint(shape, targetX, targetY, paddingRatio = 1.0) {
    if (!shape) return { x: 0, y: 0 };

    let type = (shape.Type || shape.DeviceOnContainerEdgeType || 'rectangle').toLowerCase();
    if (shape.CircleOnContainerID) type = 'circle';
    
    // COCs use CenterX/CenterY, regular shapes use WorldX/WorldY
    const cx = shape.WorldX ?? shape.CenterX;
    const cy = shape.WorldY ?? shape.CenterY;

    // Vector from center to target
    const dx = targetX - cx;
    const dy = targetY - cy;
    
    // Distance
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return { x: cx, y: cy }; // Overlapping perfectly

    if (type === 'circle' || type === 'ellipse') {
      const radius = (shape.Radius ?? (shape.Width / 2)) * paddingRatio;
      
      // Calculate intersection on circle perimeter
      // x = cx + (dx / dist) * radius
      return {
        x: cx + (dx / dist) * radius,
        y: cy + (dy / dist) * radius
      };
    } else {
      // Rectangle (or default)
      const hw = (shape.Width / 2) * paddingRatio;
      const hh = (shape.Height / 2) * paddingRatio;

      // Find intersection with bounding box
      // We test the vertical planes (left/right) and horizontal planes (top/bottom)
      
      let ix, iy;
      
      // Prevent division by zero
      const tX = dx !== 0 ? Math.abs(hw / dx) : Infinity;
      const tY = dy !== 0 ? Math.abs(hh / dy) : Infinity;

      if (tX < tY) {
        // Intersects left/right edge
        ix = dx > 0 ? cx + hw : cx - hw;
        iy = cy + dy * tX;
      } else {
        // Intersects top/bottom edge
        ix = cx + dx * tY;
        iy = dy > 0 ? cy + hh : cy - hh;
      }

      return { x: ix, y: iy };
    }
  }

  return { calculateJunctionPoint };

})();
