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
