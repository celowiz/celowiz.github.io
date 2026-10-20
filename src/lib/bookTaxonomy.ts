import type { Book } from '../types/Book';

// Mesma lista fechada de scripts/lib/books.mjs (e de scripts/taxonomy.py no second-brain).
export const THEMES = [
  'Quant',
  'Investing',
  'Economics',
  'Software',
  'Behavior',
  'Data Science',
  'Fiction & Philosophy',
] as const;
export const OTHER_THEME = 'Other';
export const LANGUAGES = ['PT', 'EN'] as const;

const isTheme = (value: unknown): value is string =>
  typeof value === 'string' && (THEMES as readonly string[]).includes(value);

/** Tema do livro; robusto a books.json antigo (sem `theme`) e a temas desconhecidos. */
export function themeOf(book: Book): string {
  if (isTheme(book.theme)) return book.theme;
  const first = book.categories?.[0] ?? book.category?.split(',')[0]?.trim();
  return isTheme(first) ? first : OTHER_THEME;
}

export function languageOf(book: Book): string | undefined {
  if (book.language) return book.language;
  const last = book.categories?.[book.categories.length - 1];
  return last && (LANGUAGES as readonly string[]).includes(last) ? last : undefined;
}

export function tagsOf(book: Book): string[] {
  return Array.isArray(book.tags) ? book.tags : [];
}

/** Temas presentes, na ordem fixa, com "Other" no fim se houver. */
export function themesPresent(books: Book[]): string[] {
  const present = new Set(books.map(themeOf));
  return [...THEMES.filter((t) => present.has(t)), ...(present.has(OTHER_THEME) ? [OTHER_THEME] : [])];
}
