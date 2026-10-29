export function normalizeRedaction(rect, width, height) {
  if (!rect || !['x', 'y', 'width', 'height'].every(key => Number.isFinite(rect[key]))) throw new TypeError('Enter finite rectangle coordinates.');
  if (rect.width <= 0 || rect.height <= 0) throw new RangeError('The area must have a positive width and height.');
  const x = Math.max(0, Math.floor(rect.x)), y = Math.max(0, Math.floor(rect.y));
  const right = Math.min(width, Math.ceil(rect.x + rect.width)), bottom = Math.min(height, Math.ceil(rect.y + rect.height));
  if (x >= right || y >= bottom) throw new RangeError('The area must overlap the screenshot.');
  return { x, y, width: right - x, height: bottom - y };
}

export function dragRectangle(start, end, width, height) {
  if (start.x === end.x || start.y === end.y) return null;
  return normalizeRedaction({ x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), width: Math.abs(end.x - start.x), height: Math.abs(end.y - start.y) }, width, height);
}

/** Map a point in layout coordinates back to source pixels. */
export function sourcePoint(x, y, image, clamp = false) {
  const point = { x: x - image.x, y: y - image.y };
  if (!clamp && (point.x < 0 || point.y < 0 || point.x > image.width || point.y > image.height)) return null;
  return { x: Math.max(0, Math.min(image.width, point.x)), y: Math.max(0, Math.min(image.height, point.y)) };
}

export function paintRedactions(ctx, rectangles, image, scaleX, scaleY) {
  ctx.save();
  ctx.fillStyle = '#000000'; ctx.globalAlpha = 1;
  // Round outward in output pixels so antialiasing never leaves a partial mask.
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (const input of rectangles) {
    const rect = normalizeRedaction(input, image.width, image.height);
    const x = Math.floor((image.x + rect.x) * scaleX), y = Math.floor((image.y + rect.y) * scaleY);
    const right = Math.ceil((image.x + rect.x + rect.width) * scaleX), bottom = Math.ceil((image.y + rect.y + rect.height) * scaleY);
    ctx.fillRect(x, y, right - x, bottom - y);
  }
  ctx.restore();
}
