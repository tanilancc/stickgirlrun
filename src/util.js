// Small math + colour helpers shared by every module.

export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (v - a) / (b - a);
export const smooth = (t) => t * t * (3 - 2 * t);
export const easeOut = (t) => 1 - (1 - t) * (1 - t);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const fract = (x) => x - Math.floor(x);

const rgbCache = new Map();
/** Parses '#rgb', '#rrggbb', 'rgb()' or 'rgba()' into [r, g, b, a]. */
export function toRgb(c) {
  let v = rgbCache.get(c);
  if (v) return v;
  if (c[0] === '#') {
    let h = c.slice(1);
    if (h.length === 3) h = h.split('').map((ch) => ch + ch).join('');
    const n = parseInt(h, 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  } else {
    const m = c.match(/rgba?\(([^)]+)\)/);
    const p = m[1].split(',').map((s) => parseFloat(s));
    v = [p[0], p[1], p[2], p[3] ?? 1];
  }
  rgbCache.set(c, v);
  return v;
}

const mixCache = new Map();
/** Linear blend between two CSS colours, cached because it runs every frame. */
export function mix(a, b, t) {
  t = clamp(t, 0, 1);
  const key = a + '|' + b + '|' + Math.round(t * 500);
  let s = mixCache.get(key);
  if (s) return s;
  const A = toRgb(a);
  const B = toRgb(b);
  const r = Math.round(lerp(A[0], B[0], t));
  const g = Math.round(lerp(A[1], B[1], t));
  const bl = Math.round(lerp(A[2], B[2], t));
  const al = lerp(A[3], B[3], t);
  s = al >= 0.999 ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${al.toFixed(3)})`;
  if (mixCache.size > 6000) mixCache.clear();
  mixCache.set(key, s);
  return s;
}

const alphaCache = new Map();
export function alpha(c, a) {
  a = clamp(a, 0, 1);
  const key = c + '|' + Math.round(a * 400);
  let s = alphaCache.get(key);
  if (s) return s;
  const A = toRgb(c);
  s = `rgba(${A[0]},${A[1]},${A[2]},${(A[3] * a).toFixed(3)})`;
  if (alphaCache.size > 6000) alphaCache.clear();
  alphaCache.set(key, s);
  return s;
}

/** amt > 0 lightens toward white, amt < 0 darkens toward black. */
export const shade = (c, amt) => (amt >= 0 ? mix(c, '#ffffff', amt) : mix(c, '#000000', -amt));
