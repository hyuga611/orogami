/**
 * `renderOgp` used to fail on a variable font with an error from inside
 * opentype.js — `TypeError: Cannot read properties of undefined (reading '265')`
 * — that names neither the font nor the cause. Noto Sans JP, the font the README
 * tells you to download, is a variable font, so passing it straight through (the
 * obvious first thing to try) landed exactly there.
 *
 * The fix is to notice the `fvar` table and say so, pointing at `subset()`.
 *
 * These build a table directory by hand rather than reading a font off disk:
 * `.fonts/` is gitignored, so anything that needs a real font cannot run in CI,
 * and a test that silently does not run is worse than no test.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isVariableFont } from '../dist/og.js';

/** A minimal sfnt: u32 tag, u16 numTables, 6 more bytes, then 16-byte records. */
function sfnt(tags) {
  const buf = Buffer.alloc(12 + tags.length * 16);
  buf.writeUInt32BE(0x00010000, 0);
  buf.writeUInt16BE(tags.length, 4);
  tags.forEach((t, i) => {
    buf.write(t, 12 + i * 16, 4, 'latin1');
  });
  return buf;
}

test('a font carrying fvar is reported as variable', () => {
  assert.equal(isVariableFont(sfnt(['cmap', 'fvar', 'glyf'])), true);
  assert.equal(isVariableFont(sfnt(['fvar'])), true);
  assert.equal(isVariableFont(sfnt(['head', 'hhea', 'hmtx', 'maxp', 'name', 'fvar'])), true);
});

/**
 * The half that matters more. Reporting a static font as variable would refuse
 * every ordinary render with advice that does not apply.
 */
test('a static font is not', () => {
  assert.equal(isVariableFont(sfnt(['cmap', 'glyf', 'head', 'loca'])), false);
  assert.equal(isVariableFont(sfnt([])), false);
});

test('a truncated or nonsense buffer is not mistaken for either', () => {
  assert.equal(isVariableFont(Buffer.alloc(0)), false);
  assert.equal(isVariableFont(Buffer.from('not a font at all')), false);
  // numTables claims more records than the buffer holds
  const lying = Buffer.alloc(12 + 16);
  lying.writeUInt16BE(400, 4);
  assert.equal(isVariableFont(lying), false);
});

test('a name that merely contains the tag is not a match', () => {
  // 'fvar' has to be the tag, not a substring landing across a record boundary
  assert.equal(isVariableFont(sfnt(['xfva', 'rxxx'])), false);
});
