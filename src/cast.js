// Who can run. Mila and Arlo are the ink-silhouette heroes of the story; the rest of the cast
// are drawn from stick-figure portraits: round heads with faces, their own hair, glasses and
// jewellery, and the clothes they wear in their pictures. Every look is data read by figure.js.
//
// Names here are placeholders that describe each portrait. Players can rename any runner on
// the cast screen; those names stay on their own device.

const SKIN = { a: '#c98f62', b: '#b57a50', c: '#a96e48', d: '#d29d72' };
const HAIR = '#17110d';

export const ROSTER = {
  girl: { name: 'Mila', tag: 'stick girl', accent: '#e0644a', accent2: '#f2b36b' },
  boy: { name: 'Arlo', tag: 'stick boy', accent: '#2f8f8a', accent2: '#e3b04b' },

  blueshirt: {
    name: 'Blue Shirt',
    tag: 'messy hair · printed shirt',
    accent: '#5a9ad0',
    accent2: '#e8c060',
    face: true,
    skin: SKIN.a,
    hair: { style: 'messy', color: HAIR },
    ears: true,
    top: { color: '#a8cbe8', pattern: 'print', patternColor: '#3e6a96', placket: true, sleeves: 'short' },
    bottom: { type: 'trousers', color: '#3a4258' },
    shoes: '#2a2018',
  },
  polo: {
    name: 'Navy Polo',
    tag: 'swept hair · polo shirt',
    accent: '#2e4a7a',
    accent2: '#e0b050',
    face: true,
    skin: SKIN.b,
    hair: { style: 'swept', color: HAIR },
    ears: true,
    top: { color: '#24365c', pattern: 'dots', patternColor: '#c8d4ea', collar: '#e8eef8', sleeves: 'short' },
    bottom: { type: 'trousers', color: '#8a7a5e' },
    shoes: '#2a2018',
  },
  braids: {
    name: 'Braids',
    tag: 'glasses · two braids · cardigan',
    accent: '#c8785a',
    accent2: '#6a8ac0',
    face: true,
    skin: SKIN.c,
    hair: { style: 'braids', color: HAIR, band: '#c8785a' },
    glasses: '#2a2420',
    earrings: { color: '#e8c060' },
    top: { color: '#f0e6d4', sleeves: 'long' },
    layer: { color: '#b8644a' },
    bottom: { type: 'skirt', color: '#34466a', length: 1 },
    shoes: '#5a3020',
  },
  curly: {
    name: 'Curly',
    tag: 'curly hair · beard · striped polo',
    accent: '#2f7a64',
    accent2: '#e8a050',
    face: true,
    skin: SKIN.b,
    hair: { style: 'curly', color: HAIR },
    beard: true,
    ears: true,
    top: { color: '#2f6a5a', pattern: 'stripes', patternColor: '#e8e0c8', collar: '#2f6a5a', sleeves: 'short' },
    bottom: { type: 'trousers', color: '#3e5a7a' },
    shoes: '#2a2018',
  },
  headband: {
    name: 'Headband',
    tag: 'wavy hair · earrings · blazer',
    accent: '#c84a4a',
    accent2: '#3a4a6a',
    face: true,
    skin: SKIN.d,
    hair: { style: 'wavy', color: HAIR, band: '#c84a4a' },
    earrings: { color: '#e8c060', drop: true },
    top: { color: '#efe8dc', sleeves: 'long' },
    layer: { color: '#2e3442', lapel: true },
    bottom: { type: 'trousers', color: '#22252e' },
    shoes: '#1a1416',
  },
  tutu: {
    name: 'Tutu',
    tag: 'pink glasses · polka dots · tutu',
    accent: '#f07aa8',
    accent2: '#9ad0e8',
    face: true,
    kid: true,
    skin: SKIN.b,
    hair: { style: 'short', color: HAIR },
    glasses: '#e8609a',
    bangles: '#e8c060',
    top: { color: '#fbf6ee', pattern: 'dots', patternColor: '#f07aa8', heart: '#e84a6a', sleeves: 'short' },
    bottom: { type: 'tutu', color: '#f49ac0', pattern: 'dots', patternColor: '#fff4f8' },
    shoes: '#f07aa8',
  },
  pinafore: {
    name: 'Pinafore',
    tag: 'bob · bindi · hoop earrings',
    accent: '#d8a03a',
    accent2: '#d84a6a',
    face: true,
    kid: true,
    skin: SKIN.c,
    hair: { style: 'bob', color: HAIR },
    bindi: '#c8283a',
    earrings: { color: '#e8c060', hoop: true },
    top: { color: '#f6f1e6', sleeves: 'short' },
    bottom: { type: 'pinafore', color: '#d8a03a', length: 0.9 },
    shoes: '#f4f4f0',
    laces: '#d84a6a',
  },
  bluedress: {
    name: 'Blue Dress',
    tag: 'ponytail · bindi · gold jewellery',
    accent: '#2a5ab0',
    accent2: '#e8b84a',
    face: true,
    skin: SKIN.c,
    hair: { style: 'ponytail', color: HAIR, band: '#e8b84a' },
    bindi: '#c8283a',
    earrings: { color: '#e8b84a', drop: true },
    necklace: '#e8b84a',
    top: { color: '#2a5ab0', pattern: 'dots', patternColor: '#e8c060', sleeves: 'none' },
    bottom: { type: 'dress', color: '#2a5ab0', pattern: 'dots', patternColor: '#e8c060', length: 1.05 },
    shoes: '#8a5a2a',
  },
};

/** The order runners appear on the cast screen. */
export const ROSTER_ORDER = ['girl', 'boy', 'blueshirt', 'polo', 'braids', 'curly', 'headband', 'tutu', 'pinafore', 'bluedress'];

export const DEFAULT_TEAM = ['girl', 'boy'];

export const lookOf = (id) => ROSTER[id] || ROSTER.girl;
