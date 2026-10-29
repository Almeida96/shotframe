import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRedaction, dragRectangle, sourcePoint, paintRedactions } from '../src/redactions.js';

test('rounds masks outward and clips them to source dimensions', () => {
  assert.deepEqual(normalizeRedaction({ x: -3.2, y: 4.8, width: 14, height: 100 }, 20, 20), { x: 0, y: 4, width: 11, height: 16 });
  assert.throws(() => normalizeRedaction({ x: 20, y: 0, width: 1, height: 1 }, 20, 20));
  assert.throws(() => normalizeRedaction({ x: NaN, y: 0, width: 1, height: 1 }, 20, 20));
});
test('reverse drags and source point mapping account for frame padding', () => {
  assert.deepEqual(dragRectangle({ x: 40, y: 50 }, { x: 10, y: 20 }, 100, 100), { x: 10, y: 20, width: 30, height: 30 });
  assert.equal(dragRectangle({ x: 10, y: 20 }, { x: 10, y: 30 }, 100, 100), null);
  const image = { x: 64, y: 102, width: 200, height: 100 };
  assert.deepEqual(sourcePoint(84, 112, image), { x: 20, y: 10 });
  assert.equal(sourcePoint(0, 0, image), null);
  assert.deepEqual(sourcePoint(900, 900, image, true), { x: 200, y: 100 });
});
test('exports paint opaque rectangles on whole output pixels at fractional scale', () => {
  const calls = [];
  const ctx = { save() {}, restore() {}, setTransform(...args) { calls.push(args); }, fillRect(...args) { calls.push(args); } };
  paintRedactions(ctx, [{ x: 1, y: 1, width: 7, height: 3 }], { x: 0.5, y: 0.5, width: 100, height: 100 }, 0.5, 0.5);
  assert.equal(ctx.fillStyle, '#000000'); assert.equal(ctx.globalAlpha, 1);
  assert.deepEqual(calls, [[1, 0, 0, 1, 0, 0], [0, 0, 5, 3]]);
});
