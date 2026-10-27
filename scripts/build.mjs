import { cp, mkdir } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'style.css', 'icon.svg', 'src', 'LICENSE']) await cp(file, `dist/${file}`, { recursive: true });
console.log('Built dist/');
