/**
 * circle-derived-geometry.js
 * ============================
 * Recalculates derived circle boundaries, padding, and 4 resize control points.
 */
'use strict';

const CircleDerivedGeometry = (() => {

  function recalculate(circle) {
    if (!circle || circle.type !== 'circle') return;

    // Default configuration parsing
    const protectionRatio = parseFloat(circle.ProtectionPaddingRadiusRatio) || 1.2;
    const hoverRatio = parseFloat(circle.HoverPaddingRadiusRatio) || 1.1;

    // Derived radius calculations
    circle.ProtectionPaddedRadius = circle.Radius * protectionRatio;
    circle.HoverPaddedRadius = circle.Radius * hoverRatio;

    // Visible bounding box (world space)
    circle.BoundingBox = {
      minX: circle.WorldX - circle.Radius,
      maxX: circle.WorldX + circle.Radius,
      minY: circle.WorldY - circle.Radius,
      maxY: circle.WorldY + circle.Radius
    };

    // Protection bounding box (world space)
    circle.ProtectionBoundingBox = {
      minX: circle.WorldX - circle.ProtectionPaddedRadius,
      maxX: circle.WorldX + circle.ProtectionPaddedRadius,
      minY: circle.WorldY - circle.ProtectionPaddedRadius,
      maxY: circle.WorldY + circle.ProtectionPaddedRadius
    };

    // 4 Resize Control Points (Top, Bottom, Left, Right)
    circle.resizeControlPoints = {
      TopResizeControlPoint: {
        x: circle.WorldX,
        y: circle.WorldY + circle.Radius,
        cursor: 'n-resize'
      },
      BottomResizeControlPoint: {
        x: circle.WorldX,
        y: circle.WorldY - circle.Radius,
        cursor: 's-resize'
      },
      LeftResizeControlPoint: {
        x: circle.WorldX - circle.Radius,
        y: circle.WorldY,
        cursor: 'w-resize'
      },
      RightResizeControlPoint: {
        x: circle.WorldX + circle.Radius,
        y: circle.WorldY,
        cursor: 'e-resize'
      }
    };
  }

  return { recalculate };
})();
