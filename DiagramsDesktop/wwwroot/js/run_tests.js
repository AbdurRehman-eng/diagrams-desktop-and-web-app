/**
 * run_tests.js
 * ============
 * Milestone 10 — Node-based test harness
 *
 * Verifies the pure geometry logic inside:
 *   sibling-rectangle-overlap-validation.js
 *   sibling-circle-overlap-validation.js
 *   multi-child-containment-protection-padding-recalculation.js
 *   multi-child-containment-save-validation.js
 *   parent-child-grouping.js
 *
 * Run with:
 *   node run_tests.js
 *
 * No browser required — all browser globals are stubbed.
 */

'use strict';

// ── 1. Stub browser globals ────────────────────────────────────────────────

global.window = global;

// Stub CanvasState with test data
global.CanvasState = {
  getShapes: () => [],
  getGlobalVars: () => ({
    rectangle: { protectionPaddingRatio: 0.10 },
    circle:    { protectionPaddingRatio: 0.10 },
  }),
};

// Stub ContainmentEngine
global.ContainmentEngine = {
  getRectProtectionPadding: (shape) => ({
    ChildProtectionPaddingX: (shape.Width  / 2) * 0.10,
    ChildProtectionPaddingY: (shape.Height / 2) * 0.10,
  }),
  getCircleProtectionPadding: (shape) => {
    const r = shape.Radius ?? shape.Width / 2;
    return r * 0.10;
  },
};

// Stub DeriveParentInnerBoundaries
global.DeriveParentInnerBoundaries = {
  fromShape: (shape) => ({
    ParentInnerLeftX:   shape.WorldX - shape.Width  / 2,
    ParentInnerRightX:  shape.WorldX + shape.Width  / 2,
    ParentInnerTopY:    shape.WorldY + shape.Height / 2,
    ParentInnerBottomY: shape.WorldY - shape.Height / 2,
  }),
};

/**
 * recalculateChildRectangleProtectionPadding
 * Stub replicating the formula from the requirement document.
 */
global.recalculateChildRectangleProtectionPadding = (cx, cy, hw, hh, px, py) => ({
  ChildProtectionLeftX:   cx - hw - px,
  ChildProtectionRightX:  cx + hw + px,
  ChildProtectionTopY:    cy + hh + py,
  ChildProtectionBottomY: cy - hh - py,
});

/**
 * recalculateChildCircleProtectionPadding
 */
global.recalculateChildCircleProtectionPadding = (cx, cy, r, pp) => ({
  ChildProtectionPaddedRadius:  r + pp,
  ChildProtectionLeftX:   cx - r - pp,
  ChildProtectionRightX:  cx + r + pp,
  ChildProtectionTopY:    cy + r + pp,
  ChildProtectionBottomY: cy - r - pp,
});

// ── 2. Load modules ────────────────────────────────────────────────────────

global.ParentChildGrouping = require('./parent-child-grouping.js');
global.SiblingRectangleOverlapValidation = require('./sibling-rectangle-overlap-validation.js');
global.SiblingCircleOverlapValidation = require('./sibling-circle-overlap-validation.js');
global.MultiChildContainmentProtectionPaddingRecalculation = require('./multi-child-containment-protection-padding-recalculation.js');
global.MultiChildContainmentSaveValidation = require('./multi-child-containment-save-validation.js');

// ── 3. Test utilities ──────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(description, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓  ${description}`);
    passed++;
  } else {
    console.error(`  ✗  ${description}`);
    console.error(`     Expected: ${expected}`);
    console.error(`     Actual  : ${actual}`);
    failed++;
  }
}

function section(name) {
  console.log(`\n── ${name} ──`);
}

// ── 4. Test: ParentChildGrouping ───────────────────────────────────────────

section('ParentChildGrouping');

const shapes = [
  { ShapeID: 'parent1', ParentContainerID: null, WorldX: 0, WorldY: 0, Width: 200, Height: 200 },
  { ShapeID: 'child1',  ParentContainerID: 'parent1', WorldX: -30, WorldY:  20, Width: 40, Height: 40 },
  { ShapeID: 'child2',  ParentContainerID: 'parent1', WorldX:  30, WorldY: -20, Width: 40, Height: 40 },
  { ShapeID: 'orphan',  ParentContainerID: null,      WorldX: 500, WorldY: 500, Width: 40, Height: 40 },
];

const groups = ParentChildGrouping.groupAllChildrenByParent(shapes);
assert('Groups parent1 children correctly',      groups['parent1']?.length, 2);
assert('Orphan not grouped',                      groups['orphan'],          undefined);
assert('getChildrenOfParent returns 2 children', ParentChildGrouping.getChildrenOfParent('parent1', shapes).length, 2);
assert('getChildrenOfParent empty for orphan',   ParentChildGrouping.getChildrenOfParent(null, shapes).length, 0);

// ── 5. Test: SiblingRectangleOverlapValidation ─────────────────────────────

section('SiblingRectangleOverlapValidation');

// Helper to compute padded bounds
function rectPP(shape) {
  const { ChildProtectionPaddingX: px, ChildProtectionPaddingY: py } = ContainmentEngine.getRectProtectionPadding(shape);
  return recalculateChildRectangleProtectionPadding(shape.WorldX, shape.WorldY, shape.Width / 2, shape.Height / 2, px, py);
}

const rectA = { ShapeID: 'A', WorldX: -40, WorldY: 0, Width: 40, Height: 40, Type: 'rectangle' };
const rectB = { ShapeID: 'B', WorldX:  40, WorldY: 0, Width: 40, Height: 40, Type: 'rectangle' };
const rectC = { ShapeID: 'C', WorldX:  -1, WorldY: 0, Width: 40, Height: 40, Type: 'rectangle' }; // overlaps A

const boundsA = rectPP(rectA);
const boundsC = rectPP(rectC);

assert('A vs B — no overlap (far apart)',
  SiblingRectangleOverlapValidation.validateChildRectangleAgainstSiblingRectangles('A', boundsA, [rectB]).valid,
  true
);

assert('A vs C — overlap detected (too close)',
  SiblingRectangleOverlapValidation.validateChildRectangleAgainstSiblingRectangles('A', boundsA, [rectC]).valid,
  false
);

assert('C vs A — overlap detected (reverse check)',
  SiblingRectangleOverlapValidation.validateChildRectangleAgainstSiblingRectangles('C', boundsC, [rectA]).valid,
  false
);

assert('Shape excluded from its own sibling set',
  SiblingRectangleOverlapValidation.validateChildRectangleAgainstSiblingRectangles('A', boundsA, [rectA]).valid,
  true
);

// ── 6. Test: SiblingCircleOverlapValidation ────────────────────────────────

section('SiblingCircleOverlapValidation');

const circA = { ShapeID: 'cA', WorldX: -50, WorldY: 0, Width: 40, Height: 40, Radius: 20, Type: 'circle', GeometryType: 'circle' };
const circB = { ShapeID: 'cB', WorldX:  50, WorldY: 0, Width: 40, Height: 40, Radius: 20, Type: 'circle', GeometryType: 'circle' };
// circC at WorldX=-12: distance to A = |-50 - (-12)| = 38 < 44 (20+20+2*2 padding) → overlaps
const circC = { ShapeID: 'cC', WorldX: -12, WorldY: 0, Width: 40, Height: 40, Radius: 20, Type: 'circle', GeometryType: 'circle' };

const ppA  = circA.Radius * 0.10;
const ppC  = circC.Radius * 0.10;

assert('Circle A vs B — no overlap (far apart)',
  SiblingCircleOverlapValidation.validateChildCircleAgainstSiblingCircles('cA', { x: circA.WorldX, y: circA.WorldY }, circA.Radius + ppA, [circB]).valid,
  true
);

assert('Circle A vs C — overlap detected (too close)',
  SiblingCircleOverlapValidation.validateChildCircleAgainstSiblingCircles('cA', { x: circA.WorldX, y: circA.WorldY }, circA.Radius + ppA, [circC]).valid,
  false
);

assert('Circle C vs A — overlap detected (reverse check)',
  SiblingCircleOverlapValidation.validateChildCircleAgainstSiblingCircles('cC', { x: circC.WorldX, y: circC.WorldY }, circC.Radius + ppC, [circA]).valid,
  false
);

// ── 7. Test: MultiChildContainmentProtectionPaddingRecalculation ───────────

section('MultiChildContainmentProtectionPaddingRecalculation');

const allShapes = [
  { ShapeID: 'parent1', ParentContainerID: null, WorldX: 0, WorldY: 0, Width: 200, Height: 200, Type: 'rectangle' },
  { ShapeID: 'child1',  ParentContainerID: 'parent1', WorldX: -40, WorldY:  30, Width: 40, Height: 40, Type: 'rectangle' },
  { ShapeID: 'child2',  ParentContainerID: 'parent1', WorldX:  40, WorldY: -30, Width: 40, Height: 40, Type: 'rectangle' },
  { ShapeID: 'cchild1', ParentContainerID: 'parent1', WorldX:   0, WorldY:   0, Width: 30, Height: 30, Radius: 15, Type: 'circle', GeometryType: 'circle' },
];

const geomResult = MultiChildContainmentProtectionPaddingRecalculation.recalculateAllMultiChildContainmentProtectionPaddingGeometry(
  null, null, null, allShapes, null, null
);

assert('Recalculation returns ok:true',                geomResult.ok, true);
assert('parentBoundaries contains parent1',           !!geomResult.parentBoundaries['parent1'], true);
assert('childRectBoundaries contains child1',         !!geomResult.childRectBoundaries['child1'], true);
assert('childRectBoundaries contains child2',         !!geomResult.childRectBoundaries['child2'], true);
assert('childCircleBoundaries contains cchild1',      !!geomResult.childCircleBoundaries['cchild1'], true);
assert('siblingGroups groups 3 children under parent1', geomResult.siblingGroups['parent1']?.length, 3);

// ── 8. Test: MultiChildContainmentSaveValidation ───────────────────────────

section('MultiChildContainmentSaveValidation');

// Valid layout — all children inside parent
const validShapes = [
  { ShapeID: 'p', ParentContainerID: null, WorldX: 0, WorldY: 0, Width: 300, Height: 300, Type: 'rectangle' },
  { ShapeID: 'r1', ParentContainerID: 'p', WorldX: -60, WorldY:  60, Width: 50, Height: 50, Type: 'rectangle' },
  { ShapeID: 'r2', ParentContainerID: 'p', WorldX:  60, WorldY: -60, Width: 50, Height: 50, Type: 'rectangle' },
];

const validGeom = MultiChildContainmentProtectionPaddingRecalculation
  .recalculateAllMultiChildContainmentProtectionPaddingGeometry(null, null, null, validShapes, null, null);
const validResult = MultiChildContainmentSaveValidation.validateCommittedMultiChildContainmentState(
  null, null, null, validGeom, null, null
);
assert('Valid layout passes save validation', validResult.ok, true);
assert('Valid layout has no errors',          validResult.errors.length, 0);

// Overlapping layout — r1 and r2 too close
const overlapShapes = [
  { ShapeID: 'p',  ParentContainerID: null, WorldX: 0, WorldY: 0, Width: 300, Height: 300, Type: 'rectangle' },
  { ShapeID: 'r1', ParentContainerID: 'p',  WorldX: -5, WorldY: 0, Width: 50, Height: 50, Type: 'rectangle' },
  { ShapeID: 'r2', ParentContainerID: 'p',  WorldX:  5, WorldY: 0, Width: 50, Height: 50, Type: 'rectangle' },
];

const overlapGeom = MultiChildContainmentProtectionPaddingRecalculation
  .recalculateAllMultiChildContainmentProtectionPaddingGeometry(null, null, null, overlapShapes, null, null);
const overlapResult = MultiChildContainmentSaveValidation.validateCommittedMultiChildContainmentState(
  null, null, null, overlapGeom, null, null
);
assert('Overlapping layout fails save validation', overlapResult.ok, false);
assert('Overlapping layout reports errors',        overlapResult.errors.length > 0, true);

// Outside-parent layout
const outsideShapes = [
  { ShapeID: 'p',  ParentContainerID: null, WorldX: 0, WorldY: 0, Width: 100, Height: 100, Type: 'rectangle' },
  { ShapeID: 'r1', ParentContainerID: 'p',  WorldX: 200, WorldY: 0, Width: 50, Height: 50, Type: 'rectangle' }, // well outside
];

const outsideGeom = MultiChildContainmentProtectionPaddingRecalculation
  .recalculateAllMultiChildContainmentProtectionPaddingGeometry(null, null, null, outsideShapes, null, null);
const outsideResult = MultiChildContainmentSaveValidation.validateCommittedMultiChildContainmentState(
  null, null, null, outsideGeom, null, null
);
assert('Child outside parent fails save validation', outsideResult.ok, false);

// ── 9. Summary ─────────────────────────────────────────────────────────────

console.log(`\n══════════════════════════════════════`);
console.log(`  Results: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════`);

if (failed > 0) {
  process.exit(1);
}
