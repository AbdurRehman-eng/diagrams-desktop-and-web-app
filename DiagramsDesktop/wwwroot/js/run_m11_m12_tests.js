/**
 * run_m11_m12_tests.js
 * ====================
 * Unit tests for Milestone 11 (Recursive Subtree Dragging) and Milestone 12 (SVG Assets and Attachments).
 * Run with:
 *   node run_m11_m12_tests.js
 */

'use strict';

// ── 1. Mock Browser/Application Globals ──────────────────────────────────────
global.window = global;

const updatedShapes = {};

global.CanvasState = {
  getShapes: () => [],
  getGlobalVars: () => ({
    rectangle: { protectionPaddingRatio: 0.10 },
    circle:    { protectionPaddingRatio: 0.10 },
  }),
  updateShape: (id, updates) => {
    updatedShapes[id] = { ...updatedShapes[id], ...updates };
  }
};

// Mock DOMParser for SVG parsing
global.DOMParser = class {
  parseFromString(svgContent, mimeType) {
    if (svgContent.includes('<parsererror>')) {
      return {
        querySelector: (sel) => {
          if (sel === 'parsererror') return { textContent: 'Mocked XML error' };
          return null;
        },
        documentElement: { nodeName: 'svg' }
      };
    }
    const tagMatch = svgContent.match(/<([a-zA-Z0-9:-]+)/);
    const nodeName = tagMatch ? tagMatch[1].toLowerCase() : 'svg';
    return {
      querySelector: () => null,
      documentElement: {
        nodeName: nodeName,
        getAttribute: (attr) => {
          if (attr === 'viewBox') {
            const match = svgContent.match(/viewBox=["']([^"']+)["']/);
            return match ? match[1] : null;
          }
          if (attr === 'width') {
            const match = svgContent.match(/width=["']([^"']+)["']/);
            return match ? match[1] : null;
          }
          if (attr === 'height') {
            const match = svgContent.match(/height=["']([^"']+)["']/);
            return match ? match[1] : null;
          }
          return null;
        },
        hasAttribute: (attr) => {
          if (attr === 'viewBox') return svgContent.includes('viewBox=');
          if (attr === 'width') return svgContent.includes('width=');
          if (attr === 'height') return svgContent.includes('height=');
          return false;
        }
      }
    };
  }
};

// Mock other dependencies
global.ContainmentEngine = {
  validateChildInParent: (child, parent) => {
    // Basic rectangle containment check
    const childLeft = child.WorldX - child.Width / 2;
    const childRight = child.WorldX + child.Width / 2;
    const childTop = child.WorldY + child.Height / 2;
    const childBottom = child.WorldY - child.Height / 2;

    const parentLeft = parent.WorldX - parent.Width / 2;
    const parentRight = parent.WorldX + parent.Width / 2;
    const parentTop = parent.WorldY + parent.Height / 2;
    const parentBottom = parent.WorldY - parent.Height / 2;

    const valid = childLeft >= parentLeft && childRight <= parentRight &&
                  childBottom >= parentBottom && childTop <= parentTop;
    return { valid, reason: valid ? null : 'Bounds violation' };
  },
  getSiblings: (shapeId, allShapes) => {
    const shape = allShapes.find(s => s.ShapeID === shapeId);
    if (!shape) return [];
    return allShapes.filter(s => s.ShapeID !== shapeId && s.ParentContainerID === shape.ParentContainerID);
  },
  getRectProtectionPadding: (shape) => ({
    ChildProtectionPaddingX: 0,
    ChildProtectionPaddingY: 0
  }),
  getCircleProtectionPadding: (shape) => 0,
  checkSiblingOverlap: (shape, siblings) => ({ collided: false })
};

global.SiblingRectangleOverlapValidation = {
  validateChildRectangleAgainstSiblingRectangles: (id, bounds, siblings) => ({ valid: true })
};

global.SiblingCircleOverlapValidation = {
  validateChildCircleAgainstSiblingCircles: (id, center, r, siblings) => ({ valid: true })
};

global.recalculateChildRectangleProtectionPadding = (x, y, hw, hh, px, py) => ({
  ChildProtectionLeftX: x - hw,
  ChildProtectionRightX: x + hw,
  ChildProtectionTopY: y + hh,
  ChildProtectionBottomY: y - hh
});

// ── 2. Load Modules under Test ───────────────────────────────────────────────
const EnumerateContainerSubtree = require('./enumerate-container-subtree.js');
const MoveContainerSubtree = require('./move-container-subtree.js');
const ValidateContainerSubtree = require('./validate-container-subtree.js');
const SvgAssetValidation = require('./svg-asset-validation.js');
const SvgAssetMetadata = require('./svg-asset-metadata.js');
const SvgPlacementRectangle = require('./svg-placement-rectangle.js');
const SvgPlacementCircle = require('./svg-placement-circle.js');
const SvgScaleHostCoupling = require('./svg-scale-host-coupling.js');
const SvgAttachmentManager = require('./svg-attachment-manager.js');

// Expose loaded modules to global namespace if they reference each other globally
global.SvgAssetValidation = SvgAssetValidation;
global.SvgAssetMetadata = SvgAssetMetadata;

// ── 3. Test Runner ──────────────────────────────────────────────────────────
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

// ── 4. Milestone 11 Tests ───────────────────────────────────────────────────
section('Milestone 11: Subtree Enumeration and Dragging');

const shapes = [
  { ShapeID: 'root', ParentContainerID: null, WorldX: 0, WorldY: 0, Width: 300, Height: 300 },
  { ShapeID: 'child1', ParentContainerID: 'root', WorldX: -20, WorldY: 20, Width: 50, Height: 50 },
  { ShapeID: 'child2', ParentContainerID: 'root', WorldX: 20, WorldY: -20, Width: 50, Height: 50 },
  { ShapeID: 'grandchild', ParentContainerID: 'child1', WorldX: -20, WorldY: 20, Width: 20, Height: 20 },
  { ShapeID: 'other', ParentContainerID: null, WorldX: 500, WorldY: 500, Width: 50, Height: 50 }
];

const descendants = EnumerateContainerSubtree.getDescendants('root', shapes);
assert('Correctly gathers descendants in nested hierarchy', descendants.length, 3);
assert('Includes child1', descendants.includes('child1'), true);
assert('Includes child2', descendants.includes('child2'), true);
assert('Includes grandchild', descendants.includes('grandchild'), true);
assert('Excludes independent root shapes', descendants.includes('other'), false);

// Translate subtree test
const snapshots = {
  'child1': { WorldX: -20, WorldY: 20 },
  'child2': { WorldX: 20, WorldY: -20 },
  'grandchild': { WorldX: -20, WorldY: 20 }
};
MoveContainerSubtree.translateSubtree(['child1', 'child2', 'grandchild'], 15, -10, snapshots);
assert('Child 1 is translated correctly', updatedShapes['child1'].WorldX, -5);
assert('Child 1 Y is translated correctly', updatedShapes['child1'].WorldY, 10);
assert('Child 2 is translated correctly', updatedShapes['child2'].WorldX, 35);
assert('Grandchild is translated correctly', updatedShapes['grandchild'].WorldX, -5);

// Subtree containment validation test
const movedShapesOk = [
  { ShapeID: 'root', ParentContainerID: null, WorldX: 10, WorldY: -10, Width: 300, Height: 300 },
  { ShapeID: 'child1', ParentContainerID: 'root', WorldX: -5, WorldY: 10, Width: 50, Height: 50 },
  { ShapeID: 'child2', ParentContainerID: 'root', WorldX: 35, WorldY: -30, Width: 50, Height: 50 },
  { ShapeID: 'grandchild', ParentContainerID: 'child1', WorldX: -5, WorldY: 10, Width: 20, Height: 20 }
];
const valResultOk = ValidateContainerSubtree.validateSubtree('root', ['child1', 'child2', 'grandchild'], movedShapesOk);
assert('Valid subtree positions pass validation', valResultOk.valid, true);

const movedShapesViolated = [
  { ShapeID: 'superRoot', ParentContainerID: null, WorldX: 0, WorldY: 0, Width: 200, Height: 200 },
  { ShapeID: 'root', ParentContainerID: 'superRoot', WorldX: 150, WorldY: 0, Width: 100, Height: 100 }, // root is outside superRoot
  { ShapeID: 'child1', ParentContainerID: 'root', WorldX: 150, WorldY: 0, Width: 50, Height: 50 }
];
const valResultViolated = ValidateContainerSubtree.validateSubtree('root', ['child1'], movedShapesViolated);
assert('Violating subtree positions fail validation', valResultViolated.valid, false);

// ── 5. Milestone 12 Tests ───────────────────────────────────────────────────
section('Milestone 12: SVG Validation and Processing');

const validSvg = '<svg viewBox="0 0 200 100"><rect x="10" y="10" width="100" height="80"/></svg>';
const badSvg1 = '<svg viewBox="0 0 100 100"><script>alert(1)</script></svg>';
const badSvg2 = '<svg viewBox="0 0 100 100" onload="alert(1)"></svg>';
const malformedSvg = '<svg viewBox="0 0 100 100"<parsererror></svg>';
const wrongRootNode = '<not-svg viewBox="0 0 100 100"></not-svg>';

assert('Valid SVG content is accepted', SvgAssetValidation.validate(validSvg).ok, true);
assert('SVG containing <script> tags is rejected', SvgAssetValidation.validate(badSvg1).ok, false);
assert('SVG containing inline onload JS handler is rejected', SvgAssetValidation.validate(badSvg2).ok, false);
assert('Malformed XML SVG is rejected', SvgAssetValidation.validate(malformedSvg).ok, false);
assert('SVG with non-svg root node is rejected', SvgAssetValidation.validate(wrongRootNode).ok, false);

// Aspect ratio extraction
assert('Correctly extracts aspect ratio from viewBox', SvgAssetMetadata.getNaturalAspectRatio(validSvg), 2.0);
assert('Correctly extracts aspect ratio from width and height fallback', SvgAssetMetadata.getNaturalAspectRatio('<svg width="300" height="150"></svg>'), 2.0);
assert('Fallback default aspect ratio is 1.0', SvgAssetMetadata.getNaturalAspectRatio('<svg></svg>'), 1.0);

// Host Placement bounds calculation
const hostRect = { ShapeID: 'r', Type: 'rectangle', WorldX: 100, WorldY: 100, Width: 160, Height: 100 };
const boundsRect = SvgPlacementRectangle.getContentBounds(hostRect);
assert('Placement rectangle center matches host shape', boundsRect.centerX, 100);
assert('Placement rectangle width matches host width', boundsRect.width, 160);

const hostCircle = { ShapeID: 'c', Type: 'circle', GeometryType: 'circle', WorldX: 200, WorldY: 200, Radius: 50 };
const boundsCircle = SvgPlacementCircle.getContentBounds(hostCircle);
const expectedSide = 50 * Math.sqrt(2);
assert('Placement circle inscribed square width matches R * sqrt(2)', boundsCircle.width, expectedSide);
assert('Placement circle inscribed square height matches R * sqrt(2)', boundsCircle.height, expectedSide);

// Scale coupling computations
const attachmentAspect = { FittingType: 'fit-aspect' };
const coupledAspect = SvgScaleHostCoupling.computeCoupling(attachmentAspect, boundsRect, 2.0); // natural size ratio = 2.0, host ratio = 1.6
assert('Fit Aspect preserveAspectRatio meets standard', coupledAspect.preserveAspectRatio, 'xMidYMid meet');
assert('Fit Aspect computes correct width', coupledAspect.width, 160);
assert('Fit Aspect scales height to maintain aspect ratio', coupledAspect.height, 80);

const attachmentStretch = { FittingType: 'fit-stretch' };
const coupledStretch = SvgScaleHostCoupling.computeCoupling(attachmentStretch, boundsRect, 2.0);
assert('Fit Stretch preserveAspectRatio is none', coupledStretch.preserveAspectRatio, 'none');
assert('Fit Stretch width matches host width', coupledStretch.width, 160);
assert('Fit Stretch height matches host height', coupledStretch.height, 100);

const attachmentCustom = { FittingType: 'custom-offset', ScaleX: 0.5, ScaleY: 0.8, OffsetX: 10, OffsetY: -20 };
const coupledCustom = SvgScaleHostCoupling.computeCoupling(attachmentCustom, boundsRect, 1.0);
assert('Custom Scaling width matches host width scaled by 0.5', coupledCustom.width, 80);
assert('Custom Scaling height matches host height scaled by 0.8', coupledCustom.height, 80);
assert('Custom Scaling applies custom offset to X coordinate', coupledCustom.x, boundsRect.centerX - 40 + 10);
assert('Custom Scaling applies custom offset to Y coordinate', coupledCustom.y, boundsRect.centerY - 40 - 20);

// SVG Attachment manager CRUD
const mockCanvasState = {
  DiagramID: 'diag1',
  Shapes: [
    { ShapeID: 'h1', Type: 'rectangle', Width: 100, Height: 100, WorldX: 0, WorldY: 0 }
  ]
};

const asset = SvgAttachmentManager.addAsset(mockCanvasState, 'Test SVG', validSvg);
assert('Asset is successfully added to canvasState', mockCanvasState.SvgAssets.length, 1);
assert('Asset has unique AssetID', !!asset.AssetID, true);

const att = SvgAttachmentManager.attachAsset(mockCanvasState, asset.AssetID, 'h1');
assert('Attachment is successfully registered to canvasState', mockCanvasState.SvgAttachments.length, 1);
assert('Attachment belongs to host shape', att.HostShapeID, 'h1');

const attachments = SvgAttachmentManager.getAttachmentsForShape(mockCanvasState, 'h1');
assert('getAttachmentsForShape returns the attachment list', attachments.length, 1);

SvgAttachmentManager.updateAttachment(mockCanvasState, att.AttachmentID, { FittingType: 'fit-stretch' });
assert('updateAttachment updates properties successfully', mockCanvasState.SvgAttachments[0].FittingType, 'fit-stretch');

SvgAttachmentManager.removeAttachment(mockCanvasState, att.AttachmentID);
assert('removeAttachment removes the attachment successfully', mockCanvasState.SvgAttachments.length, 0);

// ── 6. Summary ───────────────────────────────────────────────────────────────
console.log(`\n══════════════════════════════════════`);
console.log(`  M11/M12 Results: ${passed} passed, ${failed} failed`);
console.log(`══════════════════════════════════════`);

if (failed > 0) {
  process.exit(1);
}
