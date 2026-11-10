// App controller: game loop, screens, attract mode, audio wiring.

import { STAGES, CHAPTERS, CHARACTERS } from './stages.js';
import { DT, DIFFICULTY, GROUND_Y } from './config.js';
import { World } from './game.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { load, save, recordResult, recordEndless, endlessOpen } from './storage.js';
import { UNITS_PER_METRE } from './endless.js';
import { buildBackground, drawBackground } from './backgrounds.js';
import { createAnim, updateAnim, drawFigure } from './figure.js';
import { createRunner } from './runner.js';
import { mix } from './util.js';

const $ = (id) => document.getElementById(id);
const canvas = $('game');
const renderer = new Renderer(canvas);
const input = new Input(canvas);
const audio = new AudioEngine();
const store = load();
audio.muted = store.settings.muted;
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

/** Pseudo stage index for the endless road on the map. */
const ENDLESS = STAGES.length;
const chapterOf = (i) => CHAPTERS.findIndex((c) => i >= c.from && i <= c.to);
const endsChapter = (i) => CHAPTERS.some((c) => c.to === i);
const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

const app = {
  screen: 'title',
  current: 0,
  world: null,
  attract: true,
  attractIdx: 0,
  attractT: 0,
  paused: false,
  acc: 0,
  last: performance.now(),
  hud: { coins: -1, hearts: -2 },
  captionTimer: 0,
};

// ---------------------------------------------------------------- helpers

const STAR = (on) =>
  `<svg viewBox="0 0 24 24" class="${on ? 'on' : ''}"><path d="M12 2.6l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.9l-5.8 3.2 1.4-6.4L2.7 9.3l6.5-.7z" fill="${on ? '#e9b44c' : 'none'}" stroke="${on ? '#9a6a14' : 'rgba(21,18,15,.35)'}" stroke-width="1.4" stroke-linejoin="round"/></svg>`;
const HEART = (on) =>
  `<svg viewBox="0 0 24 22" class="${on ? '' : 'lost'}"><path d="M12 20.5C5 15.6 1.6 12 1.6 7.6 1.6 4.4 4 2 7 2c2 0 3.7 1.1 5 2.9C13.3 3.1 15 2 17 2c3 0 5.4 2.4 5.4 5.6 0 4.4-3.4 8-10.4 12.9z" fill="${on ? '#e5484d' : 'none'}" stroke="${on ? '#8a1e22' : '#f3ebdd'}" stroke-width="1.4"/></svg>`;

const runnerLabel = (m) => (m === 'duo' ? 'Mila & Arlo' : CHARACTERS[m].name);
const fmtNum = (n) => Math.round(n).toLocaleString('en-US');
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function fadeThrough(fn) {
  const f = $('fade');
  f.classList.add('on');
  setTimeout(() => {
    fn();
    requestAnimationFrame(() => f.classList.remove('on'));
  }, 460);
}

function showScreen(name) {
  app.screen = name;
  // on wide screens keep the runners clear of the text panels on the left
  const wide = window.innerWidth > 900;
  renderer.anchorFrac = wide && name === 'title' ? 0.6 : wide && name === 'ending' ? 0.56 : 0;
  for (const id of ['title', 'map', 'ending']) $(`screen-${id}`).classList.toggle('active', id === name);
  $('hud').classList.toggle('active', name === 'play');
  $('rotate-hint').classList.toggle('when-playing', name === 'play');
  if (name !== 'play') {
    $('screen-pause').classList.remove('active');
    $('screen-results').classList.remove('active');
  }
}

function keysHint() {
  const duo = store.settings.runner === 'duo';
  if (isTouch) {
    return duo
      ? 'Left half for Mila, right half for Arlo. Tap high to jump, tap low to slide.'
      : 'Tap the right side to jump (hold for higher, tap again to flip). Hold the left side to slide.';
  }
  return duo
    ? 'Mila: <kbd>W</kbd> jump · <kbd>S</kbd> slide &nbsp; Arlo: <kbd>↑</kbd> jump · <kbd>↓</kbd> slide<br><kbd>Esc</kbd> pause · <kbd>M</kbd> sound'
    : '<kbd>Space</kbd> or <kbd>↑</kbd> jump — hold for higher, tap again in the air to flip<br><kbd>↓</kbd> slide · <kbd>Esc</kbd> pause · <kbd>M</kbd> sound';
}

function syncSoundLabels() {
  const label = store.settings.muted ? 'Sound off' : 'Sound on';
  $('btn-sound-title').textContent = label;
  $('btn-sound').textContent = label;
}

function toggleMute() {
  store.settings.muted = !store.settings.muted;
  audio.setMuted(store.settings.muted);
  save(store);
  syncSoundLabels();
}

// ---------------------------------------------------------------- title

function bindChoice(groupId, key) {
  const group = $(groupId);
  const sync = () => {
    for (const b of group.querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.value === store.settings[key]));
    $('keys-hint').innerHTML = keysHint();
  };
  group.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    store.settings[key] = b.dataset.value;
    save(store);
    audio.click();
    sync();
  });
  sync();
}

const icons = [...document.querySelectorAll('canvas[data-fig]')].map((c) => {
  const kinds = c.dataset.fig === 'duo' ? ['girl', 'boy'] : [c.dataset.fig];
  return { c, kind: c.dataset.fig, figs: kinds.map((k) => ({ a: createAnim(k), r: createRunner(k) })) };
});

function drawIcons(dt) {
  for (const ic of icons) {
    const g = ic.c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, ic.c.width, ic.c.height);
    const selected = store.settings.runner === ic.kind;
    const dark = selected;
    const duo = ic.figs.length > 1;
    ic.figs.forEach((f, i) => {
      const s = duo ? 0.62 : 0.9;
      const X = duo ? 22 + i * 26 : 30;
      g.setTransform(s, 0, 0, s, X * (1 - s), 86 * (1 - s));
      updateAnim(f.a, f.r, X, 86, selected ? 300 : 0, dt);
      drawFigure(g, f.a, { ink: dark ? '#15120f' : '#f3ebdd', far: dark ? '#6a6058' : 'rgba(243,235,221,.6)' });
    });
  }
}

// ---------------------------------------------------------------- map

const thumbs = new Map();
function makeThumb(i) {
  if (thumbs.has(i)) return thumbs.get(i);
  if (i === ENDLESS) return makeEndlessThumb();
  const st = STAGES[i];
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 300;
  const g = c.getContext('2d');
  const s = 300 / 540;
  g.setTransform(s, 0, 0, s, 0, 0);
  const view = { w: 480 / s, top: 0, bottom: 540 };
  const bg = buildBackground(st);
  drawBackground(g, bg, view, { x: 300 + i * 410, y: 0 }, 4, 0.55, 0);
  const G = st.palette.ground;
  const gr = g.createLinearGradient(0, GROUND_Y, 0, 540);
  gr.addColorStop(0, G.top);
  gr.addColorStop(0.08, G.body);
  gr.addColorStop(1, G.deep);
  g.fillStyle = gr;
  g.fillRect(0, GROUND_Y, view.w, 540 - GROUND_Y);
  const fig = (kind, x, ph) => {
    const a = createAnim(kind);
    a.phase = ph;
    const r = createRunner(kind);
    updateAnim(a, r, x, GROUND_Y, 460, 0.0001);
    drawFigure(g, a, { ink: st.palette.ink, far: mix(st.palette.ink, st.palette.haze, 0.3), outline: st.palette.outline });
  };
  g.save();
  g.translate(0, 0);
  fig('boy', 250, 0.55);
  fig('girl', 320, 0.12);
  g.restore();
  thumbs.set(i, c);
  return c;
}

function makeEndlessThumb() {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 300;
  const g = c.getContext('2d');
  const n = STAGES.length;
  const slant = Math.min(46, (480 / n) * 0.6);
  for (let k = 0; k < n; k++) {
    const x0 = (k * 480) / n;
    const x1 = ((k + 1) * 480) / n;
    g.save();
    g.beginPath();
    g.moveTo(x0 + slant / 2 - (k === 0 ? 60 : 0), 0);
    g.lineTo(x1 + slant / 2 + (k === n - 1 ? 60 : 0), 0);
    g.lineTo(x1 - slant / 2 + (k === n - 1 ? 60 : 0), 300);
    g.lineTo(x0 - slant / 2 - (k === 0 ? 60 : 0), 300);
    g.closePath();
    g.clip();
    g.drawImage(makeThumb(k), 0, 0);
    g.restore();
  }
  g.strokeStyle = 'rgba(239,229,211,0.85)';
  g.lineWidth = 2;
  for (let k = 1; k < n; k++) {
    const x = (k * 480) / n;
    g.beginPath();
    g.moveTo(x + slant / 2, 0);
    g.lineTo(x - slant / 2, 300);
    g.stroke();
  }
  thumbs.set(ENDLESS, c);
  return c;
}

function openMap() {
  const diff = store.settings.diff;
  const prog = store.progress[diff];
  $('map-sub').textContent = `${runnerLabel(store.settings.runner)} · ${DIFFICULTY[diff].label}`;
  const route = $('route');
  route.innerHTML = '';
  const canvases = [];
  STAGES.forEach((st, i) => {
    const locked = i + 1 > prog.unlocked;
    const ch = CHAPTERS.find((c) => c.from === i);
    if (ch) {
      const n = CHAPTERS.indexOf(ch);
      const open = i < prog.unlocked;
      const head = document.createElement('li');
      head.className = 'chapter';
      head.innerHTML = `<span class="ch-no">Chapter ${NUM_WORDS[n + 1]}</span><span class="ch-name">${ch.name}</span><span class="ch-sub">${open ? ch.subtitle : `Opens after ${STAGES[ch.from - 1].name}`}</span>`;
      route.appendChild(head);
    }
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.disabled = locked;
    b.style.setProperty('--tilt', `${[-1.6, 1.1, -0.7, 1.5, -1.2, 0.8][i % 6]}deg`);
    const stars = prog.stars[i] || 0;
    b.innerHTML = `<canvas width="480" height="300"></canvas><span class="no">${String(i + 1).padStart(2, '0')}</span>${locked ? '<span class="lock">Locked</span>' : ''}<span class="name">${st.name}</span><span class="meta"><span class="time">${st.time}</span><span class="stars">${[0, 1, 2].map((k) => STAR(k < stars)).join('')}</span></span>`;
    b.setAttribute('aria-label', `Stage ${i + 1}, ${st.name}${locked ? ', locked' : `, ${stars} of 3 stars`}`);
    b.addEventListener('click', () => {
      audio.unlock();
      audio.click();
      startStage(i);
    });
    li.appendChild(b);
    route.appendChild(li);
    canvases.push(b.querySelector('canvas'));
  });
  {
    const open = endlessOpen(store, diff);
    const best = prog.endlessBest || 0;
    const li = document.createElement('li');
    li.className = 'endless';
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.disabled = !open;
    b.style.setProperty('--tilt', '-0.9deg');
    b.innerHTML = `<canvas width="480" height="300"></canvas><span class="no">∞</span>${open ? '' : '<span class="lock">Finish stage 6 to open</span>'}<span class="name">The Long Way Round</span><span class="meta"><span class="time">Endless · all ${NUM_WORDS[STAGES.length]}, again and again</span><span class="best">${best ? `best ${fmtNum(best)} m` : open ? 'no run yet' : ''}</span></span>`;
    b.setAttribute('aria-label', `Endless mode, the long way round${open ? (best ? `, best ${best} metres` : '') : ', locked until stage 6 is finished'}`);
    b.addEventListener('click', () => {
      audio.unlock();
      audio.click();
      startStage(ENDLESS);
    });
    li.appendChild(b);
    route.appendChild(li);
    canvases.push(b.querySelector('canvas'));
  }
  showScreen('map');
  // paint the postcards one at a time so the menu stays responsive
  let k = 0;
  const next = () => {
    if (k >= canvases.length || app.screen !== 'map') return;
    const src = makeThumb(k);
    canvases[k].getContext('2d').drawImage(src, 0, 0);
    k++;
    setTimeout(next, 16);
  };
  setTimeout(next, 30);
  const firstOpen = route.querySelector('.card:not(:disabled)');
  if (firstOpen && !isTouch) firstOpen.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- attract mode

function startAttract(i) {
  app.attract = true;
  app.attractIdx = i % STAGES.length;
  app.attractT = 0;
  const w = new World({ stageIndex: app.attractIdx, diffId: 'adult', mode: 'duo', autopilot: true, invincible: true });
  app.world = w;
  renderer.setWorld(w);
  input.enabled = false;
  if (audio.ready) audio.startStage(w.stage);
}

// ---------------------------------------------------------------- play

function startStage(i) {
  fadeThrough(() => {
    app.attract = false;
    app.paused = false;
    app.acc = 0;
    app.current = i;
    app.hud = { coins: -1, hearts: -2, metres: -1 };
    const mode = store.settings.runner;
    const endless = i === ENDLESS;
    const w = new World({ stageIndex: endless ? 0 : i, diffId: store.settings.diff, mode, endless });
    w.on(onWorldEvent);
    app.world = w;
    renderer.setWorld(w);
    const best = store.progress[store.settings.diff].endlessBest || 0;
    renderer.bestX = endless && best > 0 ? best * UNITS_PER_METRE : null;
    renderer.bestLabel = best > 0 ? `${fmtNum(best)} m` : '';
    input.setMode(mode === 'duo');
    input.enabled = true;
    showScreen('play');
    hudInit(w);
    if (endless) showCaption(null, 0, 'Endless · the long way round', `No finish line this time. ${NUM_WORDS[STAGES.length][0].toUpperCase() + NUM_WORDS[STAGES.length].slice(1)} places, round and round. How far can you get?`);
    else showCaption(w.stage, i);
    showTouchHints(mode);
    audio.unlock();
    audio.startStage(w.stage);
  });
}

function hudStageLabel(w) {
  return w.endless ? `Leg ${w.leg + 1} · ${w.stage.name}` : `${w.stageIndex + 1} · ${w.stage.name}`;
}

function hudInit(w) {
  $('hud-stage').textContent = hudStageLabel(w);
  $('hud-dist').style.display = w.endless ? 'block' : 'none';
  $('hud').classList.toggle('endless', w.endless);
  const kinds = w.runners.map((r) => r.kind);
  $('dot-0').style.background = CHARACTERS[kinds[0]].accent;
  $('dot-1').style.display = kinds.length > 1 ? 'block' : 'none';
  $('hud-hearts').style.display = w.maxHearts === Infinity ? 'none' : 'flex';
}

function hudUpdate(w) {
  const p = w.progress;
  $('track-fill').style.width = `${(p * 100).toFixed(2)}%`;
  w.runners.forEach((r, i) => {
    // endless: the track shows the way through the current landscape
    const q = w.endless ? p : Math.max(0, Math.min(1, (w.d + r.offset) / w.L.length));
    $(`dot-${i}`).style.left = `${(q * 100).toFixed(2)}%`;
  });
  if (w.endless && w.metres !== app.hud.metres) {
    app.hud.metres = w.metres;
    $('hud-dist').textContent = `${fmtNum(w.metres)} m`;
  }
  if (w.coins !== app.hud.coins) {
    const el = $('hud-coins');
    el.textContent = w.coins;
    if (app.hud.coins >= 0 && w.coins > app.hud.coins) {
      const c = el.parentElement;
      c.classList.remove('bump');
      void c.offsetWidth;
      c.classList.add('bump');
    }
    app.hud.coins = w.coins;
  }
  if (w.hearts !== app.hud.hearts && w.maxHearts !== Infinity) {
    const h = $('hud-hearts');
    h.innerHTML = Array.from({ length: w.maxHearts }, (_, k) => HEART(k < w.hearts)).join('');
    if (app.hud.hearts > w.hearts) {
      h.classList.remove('hit');
      void h.offsetWidth;
      h.classList.add('hit');
    }
    app.hud.hearts = w.hearts;
  }
}

function showCaption(stage, i, label, text) {
  const c = $('caption');
  c.innerHTML = `<span class="stage-no">${label || `Stage ${i + 1} · ${stage.time}`}</span>${text || stage.caption}`;
  c.classList.add('on');
  clearTimeout(app.captionTimer);
  app.captionTimer = setTimeout(() => c.classList.remove('on'), 4200);
}

function showTouchHints(mode) {
  const el = $('touch-hints');
  if (!isTouch) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML =
    mode === 'duo'
      ? `<div class="zone" style="left:0;top:0;width:50%;height:62%">Mila · jump</div><div class="zone" style="left:0;top:62%;width:50%;height:38%">Mila · slide</div><div class="zone" style="left:50%;top:0;width:50%;height:62%">Arlo · jump</div><div class="zone" style="left:50%;top:62%;width:50%;height:38%">Arlo · slide</div>`
      : `<div class="zone" style="left:0;top:0;width:40%;height:100%">Hold · slide</div><div class="zone" style="left:40%;top:0;width:60%;height:100%">Tap · jump</div>`;
  el.classList.add('on');
  setTimeout(() => el.classList.remove('on'), 4500);
}

function onWorldEvent(type, data) {
  const w = app.world;
  switch (type) {
    case 'jump':
      audio.jump();
      break;
    case 'djump':
      audio.djump();
      break;
    case 'land':
      audio.land(data.v);
      break;
    case 'slide':
      audio.slide(w.stage.surface);
      break;
    case 'coin':
      audio.coin(data.combo);
      break;
    case 'hit':
      audio.hit();
      break;
    case 'heart':
      audio.heart();
      break;
    case 'rescue':
      audio.rescue();
      break;
    case 'finish':
      audio.finish();
      input.enabled = false;
      break;
    case 'done':
      setTimeout(() => {
        if (app.world === w) showResults();
      }, endsChapter(w.stageIndex) ? 1600 : 900);
      break;
    case 'failed':
      audio.fail();
      input.enabled = false;
      break;
    case 'over':
      if (w.endless) showEndlessResults();
      else showFail();
      break;
    case 'leg':
      $('hud-stage').textContent = hudStageLabel(w);
      showCaption(null, 0, `Leg ${data.leg + 1} · ${data.stage.time}`, data.stage.name);
      audio.startStage(data.stage);
      break;
    default:
  }
}

function setPause(on) {
  if (app.screen !== 'play' || app.attract) return;
  const w = app.world;
  if (!w || w.status !== 'run') return;
  app.paused = on;
  $('screen-pause').classList.toggle('active', on);
  input.releaseAll();
  if (on) {
    $('pause-sub').textContent = w.endless ? `${fmtNum(w.metres)} m along the long way round` : `${w.stage.name} · ${Math.round(w.progress * 100)}% of the way`;
    $('pause-controls').innerHTML = keysHint();
    syncSoundLabels();
    if (!isTouch) $('btn-resume').focus({ preventScroll: true });
  }
}

function showResults() {
  const w = app.world;
  const s = w.summary();
  const i = w.stageIndex;
  const diff = store.settings.diff;
  recordResult(store, diff, i, s.stars, s.coins);
  if (endsChapter(i)) {
    showEnding(s, chapterOf(i));
    return;
  }
  const next = STAGES[i + 1];
  $('res-stars').innerHTML = [0, 1, 2].map((k) => STAR(k < s.stars)).join('');
  [...$('res-stars').children].forEach((el, k) => (el.style.animationDelay = `${0.15 + k * 0.18}s`));
  $('res-title').textContent = ['Made it.', 'Well run.', 'Flawless.'][s.stars - 1] || 'Made it.';
  $('res-sub').textContent = `Next up: ${next.name}, ${next.time.toLowerCase()}.`;
  const third = w.maxHearts === Infinity ? 'stumbles' : 'hearts left';
  const thirdVal = w.maxHearts === Infinity ? s.hits : `${s.hearts}/${w.maxHearts}`;
  $('res-stats').innerHTML = `<div><dt>Coins</dt><dd>${s.coins}<small style="font-size:.55em;opacity:.6">/${s.coinsTotal}</small></dd></div><div><dt>Time</dt><dd>${fmtTime(s.time)}</dd></div><div><dt>${third}</dt><dd>${thirdVal}</dd></div>`;
  const [a, b] = w.diff.starCoins;
  $('res-note').textContent =
    s.stars < 3
      ? `Stars: ${Math.round(a * 100)}% of the coins for two, ${Math.round(b * 100)}%${w.maxHearts === Infinity ? '' : ' without losing a heart'} for three.`
      : '';
  const btns = $('res-buttons');
  btns.innerHTML = '<button type="button" class="btn primary" data-act="next">Next stage</button><button type="button" class="btn" data-act="again">Run it again</button><button type="button" class="btn" data-act="map">Stage map</button>';
  btns.onclick = (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (!act) return;
    audio.click();
    if (act === 'next') startStage(i + 1);
    else if (act === 'again') startStage(i);
    else backToMap();
  };
  $('screen-results').classList.add('active');
  if (!isTouch) btns.querySelector('button').focus({ preventScroll: true });
}

function showFail() {
  const w = app.world;
  const s = w.summary();
  $('res-stars').innerHTML = '';
  $('res-title').textContent = 'Out of breath.';
  $('res-sub').textContent = 'Everybody falls. Get up and go again.';
  $('res-stats').innerHTML = `<div><dt>Made it</dt><dd>${Math.round(w.progress * 100)}%</dd></div><div><dt>Coins</dt><dd>${s.coins}</dd></div><div><dt>Time</dt><dd>${fmtTime(s.time)}</dd></div>`;
  $('res-note').textContent = 'Tip: watch the coin trails. They follow the exact arc of a full jump.';
  const btns = $('res-buttons');
  btns.innerHTML = '<button type="button" class="btn primary" data-act="again">Try again</button><button type="button" class="btn" data-act="map">Stage map</button>';
  btns.onclick = (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (!act) return;
    audio.click();
    if (act === 'again') startStage(w.stageIndex);
    else backToMap();
  };
  $('screen-results').classList.add('active');
  if (!isTouch) btns.querySelector('button').focus({ preventScroll: true });
}

function showEndlessResults() {
  const w = app.world;
  const s = w.summary();
  const diff = store.settings.diff;
  const before = store.progress[diff].endlessBest || 0;
  const isBest = recordEndless(store, diff, s.metres, s.coins);
  $('res-stars').innerHTML = '';
  $('res-title').textContent = isBest ? 'New best.' : 'The road goes on.';
  $('res-sub').textContent = `${fmtNum(s.metres)} m, as far as ${w.stage.name}.`;
  $('res-stats').innerHTML = `<div><dt>Distance</dt><dd>${fmtNum(s.metres)}<small style="font-size:.55em;opacity:.6"> m</small></dd></div><div><dt>Coins</dt><dd>${s.coins}</dd></div><div><dt>Best</dt><dd>${fmtNum(Math.max(before, s.metres))}<small style="font-size:.55em;opacity:.6"> m</small></dd></div>`;
  $('res-note').textContent = isBest
    ? before
      ? `${fmtNum(s.metres - before)} m further than ever. A flag on the road marks it now.`
      : 'A flag on the road will mark this spot next time.'
    : `${fmtNum(before - s.metres)} m short of your best. Heart pickups sit on the tall obstacles, one per landscape.`;
  const btns = $('res-buttons');
  btns.innerHTML = '<button type="button" class="btn primary" data-act="again">Run again</button><button type="button" class="btn" data-act="map">Stage map</button>';
  btns.onclick = (e) => {
    const act = e.target.closest('button')?.dataset.act;
    if (!act) return;
    audio.click();
    if (act === 'again') startStage(ENDLESS);
    else backToMap();
  };
  $('screen-results').classList.add('active');
  if (!isTouch) btns.querySelector('button').focus({ preventScroll: true });
}

const ENDINGS = [
  {
    eyebrow: 'Stage six · Frozen Pass',
    title: 'Home.',
    text: (who) => `${who('kick', 'kicks')} the snow off at the cabin door. The kettle is already on. Six places, one long day, and the light in the window was worth every step.`,
    note: 'A postcard is waiting on the mat: chapter two is open. And the long way round is endless now.',
  },
  {
    eyebrow: 'Stage twelve · Lantern Festival',
    title: 'Worth the trip.',
    text: (who) => `${who('find', 'finds')} the spot by the river that somebody kept, just as the first fireworks go up. Sand, rain, ruins, canals, that enormous sun and now the lanterns: six postcards, and every one of them worth the run.`,
    note: 'That is every stage. The long way round still goes on and on, through all twelve places.',
  },
];

function showEnding(s, chapter = 0) {
  const diff = store.settings.diff;
  const total = store.progress[diff].stars.reduce((a, b) => a + b, 0);
  const who = store.settings.runner;
  const e = ENDINGS[chapter] || ENDINGS[0];
  const subject = (plural, single) => (who === 'duo' ? `Mila and Arlo ${plural}` : `${CHARACTERS[who].name} ${single}`);
  $('end-eyebrow').textContent = e.eyebrow;
  $('end-title').textContent = e.title;
  $('end-text').textContent = e.text(subject);
  $('end-note').textContent = e.note;
  $('end-stats').innerHTML = `<div><dt>Stars</dt><dd>${total}/${STAGES.length * 3}</dd></div><div><dt>Coins this run</dt><dd>${s.coins}</dd></div><div><dt>Played on</dt><dd style="font-size:20px">${DIFFICULTY[diff].label}</dd></div>`;
  const next = CHAPTERS[chapter + 1];
  const nextBtn = $('btn-end-next');
  nextBtn.hidden = !next;
  if (next) nextBtn.innerHTML = `Chapter ${NUM_WORDS[chapter + 2]}: ${next.name} <span aria-hidden="true">→</span>`;
  $('btn-end-endless').className = next ? 'btn-light' : 'cta';
  $('btn-end-endless').innerHTML = next ? 'Keep running, endless' : 'Keep running <span aria-hidden="true">→</span>';
  input.enabled = false;
  showScreen('ending');
  if (!isTouch) (next ? nextBtn : $('btn-end-endless')).focus({ preventScroll: true });
}

function backToMap() {
  fadeThrough(() => {
    input.enabled = false;
    startAttract(app.world && !app.world.endless ? app.world.stageIndex : 0);
    openMap();
  });
}

// ---------------------------------------------------------------- wiring

bindChoice('pick-runner', 'runner');
bindChoice('pick-diff', 'diff');
syncSoundLabels();

$('btn-start').addEventListener('click', () => {
  audio.unlock();
  audio.click();
  openMap();
});
$('btn-map-back').addEventListener('click', () => {
  audio.click();
  showScreen('title');
});
$('btn-pause').addEventListener('click', () => setPause(true));
$('btn-resume').addEventListener('click', () => setPause(false));
$('btn-restart').addEventListener('click', () => {
  $('screen-pause').classList.remove('active');
  startStage(app.current);
});
$('btn-pause-map').addEventListener('click', () => {
  $('screen-pause').classList.remove('active');
  app.paused = false;
  backToMap();
});
$('btn-sound').addEventListener('click', toggleMute);
$('btn-sound-title').addEventListener('click', () => {
  audio.unlock();
  toggleMute();
});
$('btn-end-map').addEventListener('click', backToMap);
$('btn-end-next').addEventListener('click', () => {
  audio.click();
  const ch = CHAPTERS[chapterOf(app.world ? app.world.stageIndex : 0) + 1];
  startStage(ch ? ch.from : 0);
});
$('btn-end-endless').addEventListener('click', () => {
  audio.click();
  startStage(ENDLESS);
});

input.on('pause', () => {
  if (app.screen === 'play') setPause(!app.paused);
});
input.on('mute', toggleMute);
input.on('confirm', () => {
  if (app.screen === 'title') {
    audio.unlock();
    openMap();
  }
});

const unlock = () => {
  const was = audio.ready;
  audio.unlock();
  if (!was && app.attract && app.world) setTimeout(() => audio.ready && app.attract && audio.startStage(app.world.stage), 60);
};
window.addEventListener('pointerdown', unlock);
window.addEventListener('keydown', unlock);
window.addEventListener('resize', () => renderer.resize());
document.addEventListener('visibilitychange', () => {
  if (document.hidden && app.screen === 'play') setPause(true);
});

renderer.onFootstep = (surface) => {
  if (!app.attract) audio.step(surface);
};
renderer.onThunder = (delay) => audio.thunder(delay);

// ---------------------------------------------------------------- loop

function tick(now) {
  const dt = Math.min(0.05, (now - app.last) / 1000);
  app.last = now;
  input.pollPads();
  const w = app.world;
  if (w) {
    if (!app.paused) {
      app.acc += dt;
      let steps = 0;
      while (app.acc >= DT && steps < 10) {
        w.update(DT, app.attract ? null : [input.sample(0), input.sample(1)]);
        app.acc -= DT;
        steps++;
      }
      if (steps === 10) app.acc = 0;
      renderer.frame(dt, { attract: app.attract });
      if (!app.attract && app.screen === 'play') hudUpdate(w);
    } else {
      renderer.frame(0, { attract: false });
    }
    if (app.attract) {
      app.attractT += dt;
      if ((app.attractT > 32 || w.status === 'done') && !app.switching) {
        app.switching = true;
        fadeThrough(() => {
          app.switching = false;
          if (app.attract) startAttract(app.attractIdx + 1);
        });
      }
    }
  }
  if (app.screen === 'title') drawIcons(dt);
  requestAnimationFrame(tick);
}

startAttract(0);
showScreen('title');
requestAnimationFrame(tick);

// expose a tiny hook for automated screenshots / debugging
window.__game = { app, renderer, startStage, openMap, store };
