import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

// The /plan spot picker falls back to the built-in SPOT_DATA list when the AI spots route fails.
// Those cards fetch a Wikipedia lead photo by title. These titles have no article photo, or
// only a logo (checked live 2026-11-28), so each must pin its own Commons photo.
const NO_WIKI_PHOTO = ['Bangla_Road', 'Barceloneta', 'Borghese_Gallery', 'Centre_Georges_Pompidou',
  'Han_River_(South_Korea)', 'KL_Forest_Eco_Park', 'Kunsthistorisches_Museum', 'LX_Factory',
  'Overwater_bungalow', 'Penang_Street_Art', 'Petronas_Twin_Towers', 'Piazzale_Michelangelo',
  'Teamlab_Borderless', 'Tegallalang_Rice_Terrace', 'Van_Gogh_Museum'];

const html = readFileSync(new URL('../plan.html', import.meta.url), 'utf8');
const entries = [...html.matchAll(/\{name:'(?:[^'\\]|\\.)*',wiki:'((?:[^'\\]|\\.)*)'[^}]*\}/g)];

test('built-in spots without a Wikipedia photo pin a real Commons photo', () => {
  for (const title of NO_WIKI_PHOTO) {
    const hit = entries.filter(m => m[1] === title);
    assert.ok(hit.length > 0, `${title} not found in SPOT_DATA`);
    for (const m of hit) {
      const url = (m[0].match(/photoUrl:'([^']+)'/) || [])[1];
      assert.ok(url, `${title} has no photoUrl, so its card shows a blank or a logo`);
      assert.match(url, /^https:\/\/(thumb|upload)\.wikimedia\.org\/wikipedia\/commons\//, title);
      assert.doesNotMatch(url, /logo|\.svg/i, `${title} pins a logo`);
    }
  }
});
