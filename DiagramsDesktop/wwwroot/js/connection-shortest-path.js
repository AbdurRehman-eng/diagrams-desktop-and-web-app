/**
 * connection-shortest-path.js
 * ===========================
 * Calculates the shortest path between two shapes for a connection line.
 */
'use strict';

const ConnectionShortestPath = (() => {

  /**
   * Computes the routing path between a source and destination shape.
   * Currently implements a direct line between the two calculated junction points.
   * 
   * @param {Object} sourceShape 
   * @param {Object} destShape 
   * @param {Object} connectionConfig - from GlobalConnectionDefaults
   * @returns {Array} Array of {x, y} points forming the path.
   */
  function computePath(sourceShape, destShape, connectionConfig) {
    if (!sourceShape || !destShape) return [];

    const paddingRatio = connectionConfig?.TargetRadiusPaddingRatio || 1.0;

    // First approximation: direct center-to-center
    // COCs use CenterX/CenterY, regular shapes use WorldX/WorldY
    const cx1 = sourceShape.WorldX ?? sourceShape.CenterX;
    const cy1 = sourceShape.WorldY ?? sourceShape.CenterY;
    const cx2 = destShape.WorldX ?? destShape.CenterX;
    const cy2 = destShape.WorldY ?? destShape.CenterY;

    // Use junction math to find perimeter attachment points pointing at each other's centers
    const p1 = ConnectionJunctionMath.calculateJunctionPoint(sourceShape, cx2, cy2, paddingRatio);
    const p2 = ConnectionJunctionMath.calculateJunctionPoint(destShape, cx1, cy1, paddingRatio);

    // In a more advanced implementation (Milestone 8+), this would use A* routing
    // around obstacles. For Milestone 7, we return the direct multi-line points.
    return [p1, p2];
  }

  return { computePath };

})();
