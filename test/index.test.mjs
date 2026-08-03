import { test } from 'node:test';
import assert from 'node:assert/strict';

// Tested against dist/, not src/, so this covers the surface consumers actually
// import — the entry points, the .js output and the externalized budoux import.
// `npm test` runs pretest -> build, so dist is always current.
import { phrases, wrap, preview } from '../dist/index.js';

const ZWSP = '​';

const SAMPLES = [
  '今日は良い天気ですね',
  '東京都に住んでいます',
  'OGP画像を自動生成するツールです',
  '一行目\n二行目',
  '今日は 良い 天気',
  'Hello world this is plain ASCII',
  'あ',
  '',
];

test('phrases: joining the pieces reproduces the input exactly', () => {
  // The invariant that matters most. Wrapping is presentation-only: it must
  // never drop, duplicate or reorder a character. Everything else is cosmetic.
  for (const s of SAMPLES) {
    assert.equal(phrases(s).join(''), s, `lossless failed for ${JSON.stringify(s)}`);
  }
});

test('phrases: segments Japanese at phrase boundaries', () => {
  assert.deepEqual(phrases('今日は良い天気ですね'), ['今日は', '良い', '天気ですね']);
});

test('phrases: returns an array of non-empty strings', () => {
  const out = phrases('OGP画像を自動生成するツールです');
  assert.ok(Array.isArray(out));
  assert.ok(out.length > 1);
  for (const p of out) {
    assert.equal(typeof p, 'string');
    assert.notEqual(p, '');
  }
});

test('phrases: empty input yields an empty array', () => {
  assert.deepEqual(phrases(''), []);
});

test('phrases: a single character stays whole', () => {
  assert.deepEqual(phrases('あ'), ['あ']);
});

test('phrases: text with no CJK is not split', () => {
  // No phrase boundaries to find — the caller gets their string back in one piece
  // rather than an arbitrary split.
  assert.deepEqual(phrases('Hello world this is plain ASCII'), ['Hello world this is plain ASCII']);
});

test('phrases: does not split on a newline', () => {
  assert.deepEqual(phrases('一行目\n二行目'), ['一行目\n二行目']);
});

test('phrases: existing spaces are preserved, not trimmed', () => {
  // Leading spaces stay attached to their phrase — required by losslessness.
  assert.deepEqual(phrases('今日は 良い 天気'), ['今日は', ' 良い', ' 天気']);
});

test('wrap: joins phrases with U+200B', () => {
  assert.equal(wrap('今日は良い天気ですね'), `今日は${ZWSP}良い${ZWSP}天気ですね`);
});

test('wrap: the separator is exactly U+200B, not some other invisible space', () => {
  // Guards against a stray edit to the literal in src — U+FEFF or U+2060 would
  // look identical in a diff but behave differently in a renderer.
  // The input holds no separator, so anything in the output that is not in the
  // input is one.
  const input = '今日は良い天気ですね';
  const inserted = [...wrap(input)].filter((c) => !input.includes(c));
  assert.equal(inserted.length, phrases(input).length - 1);
  for (const c of inserted) assert.equal(c.codePointAt(0), 0x200b);
});

test('wrap: stripping the separators restores the input', () => {
  for (const s of SAMPLES) {
    assert.equal(wrap(s).split(ZWSP).join(''), s, `restore failed for ${JSON.stringify(s)}`);
  }
});

test('wrap: agrees with phrases()', () => {
  for (const s of SAMPLES) {
    assert.equal(wrap(s), phrases(s).join(ZWSP));
  }
});

test('wrap: empty input yields an empty string', () => {
  assert.equal(wrap(''), '');
});

test('preview: joins phrases with a visible pipe', () => {
  assert.equal(preview('今日は良い天気ですね'), '今日は|良い|天気ですね');
});

test('preview: agrees with phrases()', () => {
  for (const s of SAMPLES) {
    assert.equal(preview(s), phrases(s).join('|'));
  }
});

test('lang: defaults to Japanese', () => {
  assert.deepEqual(phrases('東京都に住んでいます'), phrases('東京都に住んでいます', { lang: 'ja' }));
});

test('lang: is actually honoured — zh-Hans segments differently from ja', () => {
  // Same input, different parser, different boundaries. If the option were being
  // ignored these would be equal and the test fails.
  const ja = phrases('東京都に住んでいます', { lang: 'ja' });
  const hans = phrases('東京都に住んでいます', { lang: 'zh-Hans' });
  assert.deepEqual(ja, ['東京都に', '住んでいます']);
  assert.deepEqual(hans, ['東京', '都', 'に住ん', 'でいます']);
  assert.notDeepEqual(ja, hans);
});

test('lang: Simplified and Traditional Chinese both parse', () => {
  assert.deepEqual(phrases('今天天气很好', { lang: 'zh-Hans' }), ['今天', '天气', '很', '好']);
  assert.deepEqual(phrases('今天天氣很好', { lang: 'zh-Hant' }), ['今天', '天氣', '很', '好']);
});

test('lang: every supported language stays lossless', () => {
  const byLang = { ja: '今日は良い天気ですね', 'zh-Hans': '今天天气很好', 'zh-Hant': '今天天氣很好' };
  for (const [lang, s] of Object.entries(byLang)) {
    assert.equal(phrases(s, { lang }).join(''), s);
    assert.equal(wrap(s, { lang }).split(ZWSP).join(''), s);
  }
});

test('parsers are cached: repeated calls return the same segmentation', () => {
  // parserFor() memoises per language. Interleave languages so a cache that
  // returned the wrong parser on a hit would show up here.
  const s = '東京都に住んでいます';
  const first = phrases(s);
  phrases('今天天气很好', { lang: 'zh-Hans' });
  phrases('今天天氣很好', { lang: 'zh-Hant' });
  assert.deepEqual(phrases(s), first);
  assert.deepEqual(phrases(s), first);
});

test('known behaviour: wrap() is not idempotent — separators accumulate', () => {
  // Documenting current behaviour, not endorsing it. budoux does not treat an
  // existing U+200B as a boundary, so wrapping twice yields two separators per
  // boundary. Callers must wrap raw text, not already-wrapped text.
  const once = wrap('今日は良い天気ですね');
  const twice = wrap(once);
  assert.notEqual(twice, once);
  assert.equal(twice, `今日は${ZWSP}${ZWSP}良い${ZWSP}${ZWSP}天気ですね`);
  // Still lossless once the separators are stripped.
  assert.equal(twice.split(ZWSP).join(''), '今日は良い天気ですね');
});

test('known behaviour: an unsupported lang throws TypeError', () => {
  // TypeScript blocks this at compile time; plain-JS consumers can still reach it.
  assert.throws(() => phrases('今日は良い天気ですね', { lang: 'xx' }), TypeError);
});
