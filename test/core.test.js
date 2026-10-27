import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, PRESETS, BAR_HEIGHT, normalizeOptions, calculateLayout, checkExportSize, gradientLine, detectImageType, exportName, validateSource } from '../src/core.js';

test('default layout adds equal padding without resizing the source', () => {
  const result = calculateLayout(960, 600);
  assert.equal(result.width, 1088); assert.equal(result.height, 728);
  assert.deepEqual(result.image, { x: 64, y: 64, width: 960, height: 600 });
  assert.equal(result.outputWidth, 1088); assert.equal(result.outputHeight, 728);
});

test('window chrome adds space above the screenshot', () => {
  for (const chrome of ['light', 'dark']) {
    const result = calculateLayout(960, 600, { chrome });
    assert.equal(result.bar, BAR_HEIGHT); assert.equal(result.height, 728 + BAR_HEIGHT);
    assert.equal(result.image.y, result.frame.y + BAR_HEIGHT);
    assert.equal(result.image.height, 600);
  }
});

test('square canvas expands around landscape and portrait screenshots', () => {
  const landscape = calculateLayout(800, 400, { ratio: 'square', padding: 0 });
  assert.deepEqual(landscape.image, { x: 0, y: 200, width: 800, height: 400 });
  assert.equal(landscape.width, landscape.height);
  const portrait = calculateLayout(400, 800, { ratio: 'square', padding: 20 });
  assert.deepEqual(portrait.image, { x: 220, y: 20, width: 400, height: 800 });
});

test('wide and portrait ratios preserve the full source and minimum padding', () => {
  for (const [width, height] of [[1200, 100], [100, 1200], [13, 17], [1, 1]]) for (const [ratio, target] of [['wide', 16 / 9], ['portrait', 4 / 5]]) {
    const result = calculateLayout(width, height, { ratio, chrome: 'light', padding: 12 });
    assert.ok(Math.abs(result.width - result.height * target) <= 2);
    assert.ok(result.frame.x >= 12 && result.frame.y >= 12);
    assert.ok(result.width - result.image.x - result.image.width >= 12);
    assert.ok(result.height - result.image.y - result.image.height >= 12);
    assert.equal(result.image.width, width); assert.equal(result.image.height, height);
  }
});

test('scale changes output dimensions but leaves layout coordinates alone', () => {
  const base = calculateLayout(301, 203, { padding: 0 });
  for (const scale of [0.5, 1, 2]) {
    const result = calculateLayout(301, 203, { padding: 0, scale });
    assert.deepEqual(result.image, base.image);
    assert.equal(result.outputWidth, Math.round(301 * scale));
    assert.equal(result.outputHeight, Math.round(203 * scale));
  }
  assert.equal(calculateLayout(1, 1, { scale: 0.5, padding: 0 }).outputWidth, 1);
});

test('corner radius is bounded for narrow images', () => {
  assert.equal(calculateLayout(8, 600, { radius: 48 }).radius, 4);
  assert.equal(calculateLayout(600, 8, { radius: 48 }).radius, 4);
  assert.equal(calculateLayout(600, 600, { radius: 0 }).radius, 0);
});

test('export limits account for the scaled canvas and aspect expansion', () => {
  assert.doesNotThrow(() => checkExportSize(calculateLayout(8192, 100, { padding: 0 })));
  assert.throws(() => checkExportSize(calculateLayout(8192, 100, { padding: 1 })), /too large/);
  assert.throws(() => checkExportSize(calculateLayout(6000, 6000, { padding: 0 })), /too large/);
  assert.doesNotThrow(() => checkExportSize(calculateLayout(6000, 6000, { padding: 0, scale: 0.5 })));
  assert.throws(() => checkExportSize(calculateLayout(4000, 4000, { scale: 2 })), /too large/);
  assert.throws(() => checkExportSize(calculateLayout(300, 6000, { ratio: 'wide' })), /too large/);
});

test('source dimension validation rejects empty, huge and noninteger images', () => {
  for (const pair of [[0, 1], [1, -1], [1.5, 5], [NaN, 5], [Infinity, 1], [16385, 1], [10000, 5000]]) assert.throws(() => validateSource(...pair));
  assert.doesNotThrow(() => validateSource(8000, 5000));
});

test('normalization rejects invalid enum, numeric, color and title inputs', () => {
  for (const input of [{ background: 'url' }, { chrome: 'browser' }, { ratio: '__proto__' }, { scale: 3 }, { padding: -1 }, { radius: 100 }, { shadow: NaN }, { angle: Infinity }, { color1: 'red' }, { color2: '#fff' }, { title: null }, { title: 'x'.repeat(81) }]) assert.throws(() => normalizeOptions(input));
  assert.deepEqual(normalizeOptions(), DEFAULTS);
  assert.doesNotThrow(() => normalizeOptions({ title: 'x'.repeat(80) }));
});

test('presets and default objects remain unchanged after normalization', () => {
  for (const { name, ...preset } of PRESETS) {
    assert.ok(name); assert.doesNotThrow(() => normalizeOptions(preset));
  }
  const result = normalizeOptions(); result.color1 = '#000000';
  assert.equal(DEFAULTS.color1, '#e8d6c6');
  assert.ok(Object.isFrozen(PRESETS[0]));
});

test('gradient direction follows CSS angles for vertical and horizontal fills', () => {
  const near = (a, b) => a.forEach((value, i) => assert.ok(Math.abs(value - b[i]) < 1e-8));
  near(gradientLine(200, 100, 0), [100, 100, 100, 0]);
  near(gradientLine(200, 100, 90), [0, 50, 200, 50]);
  near(gradientLine(200, 100, 180), [100, 0, 100, 100]);
  near(gradientLine(200, 100, 270), [200, 50, 0, 50]);
});

test('diagonal gradient endpoints are centered and finite', () => {
  for (const angle of [45, 135, 225, 315]) {
    const [x1, y1, x2, y2] = gradientLine(400, 200, angle);
    assert.equal((x1 + x2) / 2, 200); assert.equal((y1 + y2) / 2, 100);
    assert.ok([x1, y1, x2, y2].every(Number.isFinite));
  }
});

test('image type detection reads signatures instead of trusting file extensions', () => {
  assert.equal(detectImageType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])), 'image/png');
  assert.equal(detectImageType(new Uint8Array([255, 216, 255, 224])), 'image/jpeg');
  assert.equal(detectImageType(new TextEncoder().encode('RIFF1234WEBP')), 'image/webp');
  for (const bytes of [[], [137, 80, 78, 71], [255, 216], [...new TextEncoder().encode('<svg></svg>')], [...new TextEncoder().encode('GIF89a')]]) assert.equal(detectImageType(new Uint8Array(bytes)), null);
});

test('download names remove paths, extensions and unsafe punctuation', () => {
  assert.equal(exportName('screen.png'), 'screen-shotframe.png');
  assert.equal(exportName('C:\\fakepath\\Screenshot 2026.jpeg'), 'Screenshot-2026-shotframe.png');
  assert.equal(exportName('../../sample.webp'), 'sample-shotframe.png');
  assert.equal(exportName('<script>.png'), 'script-shotframe.png');
  assert.equal(exportName('...'), 'screenshot-shotframe.png');
  assert.equal(exportName('x'.repeat(100) + '.png').length, 94);
});
