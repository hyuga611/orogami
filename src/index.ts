import {
  loadDefaultJapaneseParser,
  loadDefaultSimplifiedChineseParser,
  loadDefaultTraditionalChineseParser,
} from 'budoux';

const ZWSP = '​';

export type Lang = 'ja' | 'zh-Hans' | 'zh-Hant';
type Parser = ReturnType<typeof loadDefaultJapaneseParser>;

const factories: Record<Lang, () => Parser> = {
  ja: loadDefaultJapaneseParser,
  'zh-Hans': loadDefaultSimplifiedChineseParser,
  'zh-Hant': loadDefaultTraditionalChineseParser,
};

const cache = new Map<Lang, Parser>();
function parserFor(lang: Lang): Parser {
  let p = cache.get(lang);
  if (!p) { p = factories[lang](); cache.set(lang, p); }
  return p;
}

export function phrases(text: string, opts: { lang?: Lang } = {}): string[] {
  return parserFor(opts.lang ?? 'ja').parse(text);
}

export function wrap(text: string, opts: { lang?: Lang } = {}): string {
  return phrases(text, opts).join(ZWSP);
}

export function preview(text: string, opts: { lang?: Lang } = {}): string {
  return phrases(text, opts).join('|');
}
