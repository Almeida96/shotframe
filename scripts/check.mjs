import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) check(path);
    else if (/\.m?js$/.test(path)) execFileSync(process.execPath, ['--check', path], { stdio: 'inherit' });
  }
}
for (const dir of ['src', 'scripts', 'test']) check(dir);
const html = readFileSync('index.html', 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML IDs');
for (const [, id] of readFileSync('src/app.js', 'utf8').matchAll(/\$\('([^']+)'\)/g)) assert.ok(ids.includes(id), `Missing element: ${id}`);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
assert.ok(html.includes(`ShotFrame <span>${pkg.version}</span>`), 'Version differs from package.json');
console.log('JavaScript syntax, version, and UI references checked.');
