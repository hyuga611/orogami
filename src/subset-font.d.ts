// Minimal ambient types for `subset-font` (ships no declarations of its own).
// Only the surface orogami uses.
declare module 'subset-font' {
  export default function subsetFont(
    font: Buffer,
    text: string,
    options?: {
      targetFormat?: 'truetype' | 'woff' | 'woff2' | 'sfnt';
      variationAxes?: Record<string, number>;
    },
  ): Promise<Buffer>;
}
