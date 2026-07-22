/**
 * slugify
 * ---------------------------------------------------------------------
 * Converts a title (Arabic or English) into a URL-safe slug.
 * Arabic text is transliterated by keeping the Arabic characters
 * (Next.js/Nginx handle UTF-8 slugs fine) while stripping punctuation,
 * collapsing whitespace into hyphens, and appending a short random
 * suffix to guarantee uniqueness even for identical titles.
 * ---------------------------------------------------------------------
 */
export function slugify(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // strip punctuation, keep letters/numbers (incl. Arabic)
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${randomSuffix}`;
}
