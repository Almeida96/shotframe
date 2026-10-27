import { normalizeOptions, calculateLayout, gradientLine, checkExportSize } from './core.js';

function rounded(ctx, x, y, width, height, radius) {
  ctx.beginPath(); ctx.roundRect(x, y, width, height, radius);
}

function fitTitle(ctx, title, maxWidth) {
  if (maxWidth <= 0) return '';
  if (ctx.measureText(title).width <= maxWidth) return title;
  let clipped = title;
  while (clipped && ctx.measureText(clipped + '…').width > maxWidth) clipped = clipped.slice(0, -1);
  return clipped ? clipped + '…' : '';
}

export function renderFrame(canvas, source, input, { preview = false } = {}) {
  const options = normalizeOptions(input);
  const layout = calculateLayout(source.width, source.height, options);
  if (!preview) checkExportSize(layout);
  const factor = preview ? Math.min(1, 1500 / Math.max(layout.width, layout.height)) : options.scale;
  canvas.width = Math.max(1, Math.round(layout.width * factor));
  canvas.height = Math.max(1, Math.round(layout.height * factor));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser could not create an image canvas.');
  ctx.scale(canvas.width / layout.width, canvas.height / layout.height);
  if (options.background !== 'transparent') {
    ctx.fillStyle = options.color1;
    if (options.background === 'gradient') {
      const gradient = ctx.createLinearGradient(...gradientLine(layout.width, layout.height, options.angle));
      gradient.addColorStop(0, options.color1); gradient.addColorStop(1, options.color2); ctx.fillStyle = gradient;
    }
    ctx.fillRect(0, 0, layout.width, layout.height);
  }
  const frame = layout.frame;
  // Draw the shadow on a separate surface so transparent pixels stay transparent.
  if (options.shadow > 0) {
    const shadow = document.createElement('canvas'); shadow.width = canvas.width; shadow.height = canvas.height;
    const s = shadow.getContext('2d');
    s.scale(canvas.width / layout.width, canvas.height / layout.height);
    rounded(s, frame.x, frame.y, frame.width, frame.height, layout.radius);
    s.fillStyle = '#000'; s.shadowColor = '#00000055'; s.shadowBlur = options.shadow * factor; s.shadowOffsetY = options.shadow * factor / 2; s.fill();
    s.shadowColor = 'transparent'; s.globalCompositeOperation = 'destination-out';
    rounded(s, frame.x, frame.y, frame.width, frame.height, layout.radius); s.fill();
    ctx.drawImage(shadow, 0, 0, layout.width, layout.height);
    shadow.width = 1; shadow.height = 1;
  }
  ctx.save(); rounded(ctx, frame.x, frame.y, frame.width, frame.height, layout.radius); ctx.clip();
  if (layout.bar) {
    const dark = options.chrome === 'dark';
    ctx.fillStyle = dark ? '#26282d' : '#f3f2f0'; ctx.fillRect(frame.x, frame.y, frame.width, layout.bar);
    ctx.fillStyle = dark ? '#d3d4d8' : '#65645f'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(fitTitle(ctx, options.title, frame.width - 160), frame.x + frame.width / 2, frame.y + layout.bar / 2);
    if (frame.width >= 100) for (const [i, color] of ['#ed6b60', '#f4bf50', '#61c454'].entries()) {
      ctx.beginPath(); ctx.arc(frame.x + 18 + i * 16, frame.y + layout.bar / 2, 4.5, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    }
  }
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, layout.image.x, layout.image.y, layout.image.width, layout.image.height);
  ctx.restore();
  return layout;
}

export function toPNG(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('PNG export failed. Try a smaller output size.')), 'image/png'));
}
