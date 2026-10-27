export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_SOURCE_PIXELS = 40000000;
export const MAX_EXPORT_PIXELS = 32000000;
export const MAX_EXPORT_EDGE = 8192;
export const BAR_HEIGHT = 38;
export const RATIOS = Object.freeze({ auto: null, square: 1, wide: 16 / 9, portrait: 4 / 5 });
export const DEFAULTS = Object.freeze({ background: 'gradient', color1: '#e8d6c6', color2: '#c78869', angle: 135, padding: 64, radius: 12, shadow: 24, ratio: 'auto', chrome: 'none', title: '', scale: 1 });
export const PRESETS = Object.freeze([
  { name: 'Clay', background: 'gradient', color1: '#e8d6c6', color2: '#c78869', angle: 135 },
  { name: 'Paper', background: 'solid', color1: '#eae7df', color2: '#eae7df', angle: 135 },
  { name: 'Moss', background: 'gradient', color1: '#d9e4d0', color2: '#809c84', angle: 135 },
  { name: 'Sky', background: 'gradient', color1: '#d5e6eb', color2: '#7496ac', angle: 135 },
  { name: 'Ink', background: 'gradient', color1: '#484b54', color2: '#202127', angle: 135 },
  { name: 'Clear', background: 'transparent', color1: '#ffffff', color2: '#ffffff', angle: 135 },
].map(Object.freeze));

export function validateSource(width, height) {
  if (![width, height].every(value => Number.isInteger(value) && value > 0)) throw new Error('The image has invalid dimensions.');
  if (width > 16384 || height > 16384 || width * height > MAX_SOURCE_PIXELS) throw new Error('Use an image up to 40 megapixels and 16,384 pixels per side.');
}

export function normalizeOptions(input = {}) {
  const options = { ...DEFAULTS, ...input };
  for (const [name, allowed] of Object.entries({ background: ['solid', 'gradient', 'transparent'], chrome: ['none', 'light', 'dark'], ratio: Object.keys(RATIOS), scale: [0.5, 1, 2] })) {
    if (!allowed.includes(options[name])) throw new Error(`Invalid ${name}.`);
  }
  for (const [name, min, max] of [['padding', 0, 160], ['radius', 0, 48], ['shadow', 0, 64], ['angle', 0, 360]]) {
    if (!Number.isFinite(options[name]) || options[name] < min || options[name] > max) throw new Error(`Invalid ${name}.`);
  }
  for (const key of ['color1', 'color2']) if (typeof options[key] !== 'string' || !/^#[0-9a-f]{6}$/i.test(options[key])) throw new Error('Use a six-digit hex color.');
  if (typeof options.title !== 'string' || options.title.length > 80) throw new Error('Window title must be 80 characters or fewer.');
  return options;
}

export function calculateLayout(sourceWidth, sourceHeight, input = {}) {
  validateSource(sourceWidth, sourceHeight);
  const options = normalizeOptions(input);
  const bar = options.chrome === 'none' ? 0 : BAR_HEIGHT;
  const frameWidth = sourceWidth, frameHeight = sourceHeight + bar;
  let width = frameWidth + options.padding * 2, height = frameHeight + options.padding * 2;
  const ratio = RATIOS[options.ratio];
  if (ratio) {
    if (width / height < ratio) width = height * ratio;
    else height = width / ratio;
  }
  width = Math.ceil(width); height = Math.ceil(height);
  return {
    width, height, bar,
    frame: { x: (width - frameWidth) / 2, y: (height - frameHeight) / 2, width: frameWidth, height: frameHeight },
    image: { x: (width - frameWidth) / 2, y: (height - frameHeight) / 2 + bar, width: sourceWidth, height: sourceHeight },
    radius: Math.min(options.radius, frameWidth / 2, frameHeight / 2),
    outputWidth: Math.max(1, Math.round(width * options.scale)),
    outputHeight: Math.max(1, Math.round(height * options.scale)),
  };
}

export function checkExportSize(layout) {
  if (layout.outputWidth > MAX_EXPORT_EDGE || layout.outputHeight > MAX_EXPORT_EDGE || layout.outputWidth * layout.outputHeight > MAX_EXPORT_PIXELS) {
    throw new Error('This export is too large. Lower the scale, reduce padding, or use a smaller image. The limit is 8,192 pixels per side and 32 megapixels.');
  }
}

export function gradientLine(width, height, degrees) {
  const angle = degrees * Math.PI / 180;
  const dx = Math.sin(angle), dy = -Math.cos(angle);
  const length = Math.abs(width * dx) + Math.abs(height * dy);
  return [width / 2 - dx * length / 2, height / 2 - dy * length / 2, width / 2 + dx * length / 2, height / 2 + dy * length / 2];
}

export function detectImageType(bytes) {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp';
  return null;
}

export function exportName(name) {
  const base = String(name).replace(/^.*[\\/]/, '').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'screenshot';
  return `${base}-shotframe.png`;
}
