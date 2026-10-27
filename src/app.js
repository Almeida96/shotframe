import { DEFAULTS, PRESETS, MAX_FILE_BYTES, validateSource, detectImageType, checkExportSize, exportName } from './core.js';
import { renderFrame, toPNG } from './render.js';
import { createSample } from './sample.js';

const $ = id => document.getElementById(id);
const fields = Object.keys(DEFAULTS);
const numbers = new Set(['angle', 'padding', 'radius', 'shadow', 'scale']);
let source = createSample(), sourceName = 'sample.png', isSample = true, busy = false, requestId = 0, renderId = 0, layout;
const canCopy = typeof ClipboardItem !== 'undefined' && Boolean(navigator.clipboard?.write);
const say = text => { $('status').textContent = text; };
const showError = text => { $('error').textContent = text; $('error').hidden = !text; };

function options() { return Object.fromEntries(fields.map(key => [key, numbers.has(key) ? Number($(key).value) : $(key).value])); }
function setOptions(values) { for (const [key, value] of Object.entries(values)) $(key).value = String(value); }
function lock(value) {
  busy = value; $('controls').disabled = value;
  for (const key of ['upload', 'sample', 'reset']) $(key).disabled = value;
  updateButtons();
}
function updateButtons() {
  let allowed = Boolean(layout);
  try { if (layout) checkExportSize(layout); } catch { allowed = false; }
  $('download').disabled = busy || !allowed;
  $('copy').disabled = busy || !allowed || !canCopy;
  $('copy').title = canCopy ? 'Copy the framed image' : 'Image copying is unavailable in this browser. Use Download PNG.';
}
function refresh() {
  const settings = options();
  $('color-fields').hidden = settings.background === 'transparent';
  $('second-color').hidden = settings.background !== 'gradient';
  $('angle-field').hidden = settings.background !== 'gradient';
  $('title-field').hidden = settings.chrome === 'none';
  for (const key of ['angle', 'padding', 'radius', 'shadow']) $(`${key}-value`).textContent = `${settings[key]}${key === 'angle' ? '°' : ' px'}`;
  for (const [index, button] of [...$('presets').children].entries()) {
    const preset = PRESETS[index];
    const matches = preset.background === settings.background && (settings.background === 'transparent' || preset.color1 === settings.color1 && (settings.background === 'solid' || preset.color2 === settings.color2 && preset.angle === settings.angle));
    button.setAttribute('aria-pressed', String(matches));
  }
  try {
    layout = renderFrame($('preview'), source, settings, { preview: true });
    $('source-size').textContent = `${source.width.toLocaleString('en-US')} × ${source.height.toLocaleString('en-US')} px`;
    $('source-name').textContent = isSample ? 'Sample screenshot' : sourceName;
    $('output-size').textContent = `${layout.outputWidth.toLocaleString('en-US')} × ${layout.outputHeight.toLocaleString('en-US')} px`;
    $('preview').setAttribute('aria-label', `Framed ${isSample ? 'sample screenshot' : sourceName}, ${settings.background} background, ${layout.outputWidth} by ${layout.outputHeight} pixels`);
    checkExportSize(layout); showError('');
  } catch (error) { showError(error.message); }
  updateButtons();
}
function scheduleRender() { cancelAnimationFrame(renderId); renderId = requestAnimationFrame(refresh); }

for (const [index, preset] of PRESETS.entries()) {
  const button = document.createElement('button'); button.type = 'button'; button.className = `preset preset-${index}`; button.setAttribute('aria-label', `${preset.name} background`); button.title = preset.name;
  const swatch = document.createElement('span'); swatch.className = 'swatch'; swatch.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span'); label.textContent = preset.name; button.append(swatch, label);
  button.addEventListener('click', () => { const { name, ...values } = preset; setOptions(values); refresh(); say(`${name} background applied.`); });
  $('presets').append(button);
}
$('controls').addEventListener('input', scheduleRender);
$('controls').addEventListener('change', () => { refresh(); say('Preview updated.'); });
$('reset').addEventListener('click', () => { setOptions(DEFAULTS); refresh(); say('Frame settings reset.'); });
$('upload').addEventListener('click', () => $('file').click());
$('file').addEventListener('change', () => { const file = $('file').files[0]; $('file').value = ''; if (file) loadFile(file); });

async function loadFile(file) {
  if (busy) return;
  const id = ++requestId;
  showError(''); say('Opening image…');
  let bitmap;
  try {
    if (file.size > MAX_FILE_BYTES) throw new Error('Choose an image smaller than 25 MB.');
    const type = detectImageType(new Uint8Array(await file.slice(0, 12).arrayBuffer()));
    if (!type) throw new Error('Choose a PNG, JPEG, or WebP image. SVG and GIF files are not supported.');
    bitmap = await createImageBitmap(new Blob([file], { type }));
    validateSource(bitmap.width, bitmap.height);
    if (id !== requestId || busy) { bitmap.close(); return; }
    source.close?.(); source = bitmap; bitmap = null; sourceName = file.name || 'pasted-image.png'; isSample = false;
    refresh(); say('Image opened. Adjust the frame or download the PNG.');
  } catch (error) {
    bitmap?.close();
    if (id !== requestId) return;
    showError(error instanceof DOMException ? 'This image could not be decoded. Try another PNG, JPEG, or WebP file.' : error.message); say('The previous image has been kept.');
  }
}
$('sample').addEventListener('click', () => { requestId++; source.close?.(); source = createSample(); sourceName = 'sample.png'; isSample = true; refresh(); say('Sample screenshot loaded.'); });

let dragDepth = 0;
document.addEventListener('dragenter', event => { if ([...event.dataTransfer.types].includes('Files')) { event.preventDefault(); dragDepth++; $('drop-zone').classList.add('dragging'); } });
document.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; $('drop-zone').classList.remove('dragging'); } });
document.addEventListener('dragover', event => { if ([...event.dataTransfer.types].includes('Files')) event.preventDefault(); });
document.addEventListener('drop', event => {
  event.preventDefault(); dragDepth = 0; $('drop-zone').classList.remove('dragging');
  if (event.dataTransfer.files.length > 1) { showError('Open one image at a time.'); return; }
  if (event.dataTransfer.files[0]) loadFile(event.dataTransfer.files[0]);
});
document.addEventListener('paste', event => {
  const file = [...(event.clipboardData?.files || [])].find(file => file.type.startsWith('image/'));
  if (file) { event.preventDefault(); loadFile(file); }
});
if (/Mac|iPhone|iPad/.test(navigator.platform)) $('paste-key').textContent = '⌘';

async function buildPNG() {
  const canvas = document.createElement('canvas');
  try { renderFrame(canvas, source, options()); return await toPNG(canvas); }
  finally { canvas.width = 1; canvas.height = 1; }
}
async function exportImage(action) {
  if (busy) return;
  requestId++; lock(true); showError(''); say(action === 'copy' ? 'Copying PNG…' : 'Preparing PNG…');
  try {
    if (action === 'copy') {
      // Pass the promise immediately to retain the click's clipboard permission.
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': buildPNG() })]);
      say('PNG copied. Paste it into another app.');
    } else {
      const blob = await buildPNG();
      const url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.download = exportName(sourceName); link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      say(`Downloaded ${link.download}.`);
    }
  } catch (error) { showError(action === 'copy' ? 'Image copying was blocked or unavailable. Use Download PNG instead.' : error.message); say('Export did not complete.'); }
  finally { lock(false); }
}
$('download').addEventListener('click', () => exportImage('download'));
$('copy').addEventListener('click', () => exportImage('copy'));
setOptions(DEFAULTS); refresh();
