// The Content-Security-Policy meta tags must keep matching the pages they protect.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const cspOf = (html) => html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];

test('every page has a Content-Security-Policy meta tag', () => {
  for (const f of ['index.html', 'privacy.html', 'terms.html', '404.html']) assert.ok(cspOf(read(f)), `${f} has no CSP`);
});

test('the game page and the code it builds use no inline scripts or style attributes', () => {
  const csp = cspOf(read('index.html'));
  assert.ok(!csp.includes('unsafe-inline'));
  const html = read('index.html');
  assert.ok(!/<script(?![^>]*\bsrc=)[^>]*>/.test(html), 'inline <script> in index.html');
  assert.ok(!/style="/.test(html), 'style attribute in index.html');
  for (const f of readdirSync(new URL('../src/', import.meta.url))) {
    assert.ok(!/style="/.test(read('src/' + f)), `style attribute in HTML built by src/${f}`);
  }
});

test("each static page's CSP hash matches its <style> block", () => {
  for (const f of ['privacy.html', 'terms.html', '404.html']) {
    const html = read(f);
    const body = html.match(/<style>([\s\S]*?)<\/style>/)[1];
    const hash = createHash('sha256').update(body).digest('base64');
    assert.ok(cspOf(html).includes(`'sha256-${hash}'`), `${f}: recompute the style hash in its CSP`);
  }
});

test('the game loads nothing from other sites, and every self-hosted font file exists', () => {
  const html = read('index.html');
  const loads = [...html.matchAll(/<(?:link|script)\b[^>]*\b(?:href|src)="([^"]+)"/g)].map((m) => m[1]);
  for (const u of loads) assert.ok(!/^(https?:)?\/\//.test(u), `index.html loads ${u} from another site`);
  assert.ok(!/https?:/.test(cspOf(html)), 'the game CSP should allow no outside hosts');
  const css = read('css/fonts.css');
  const files = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]);
  assert.ok(files.length > 0);
  for (const f of files) {
    assert.ok(!/^(https?:)?\/\//.test(f), `fonts.css loads ${f} from another site`);
    assert.ok(readFileSync(new URL('../css/' + f, import.meta.url)).length > 1000, `missing font ${f}`);
  }
  assert.match(read('css/fonts/OFL.txt'), /SIL OPEN FONT LICENSE Version 1\.1/);
});
