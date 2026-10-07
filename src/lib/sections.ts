export const SECTION_IDS = [
  'hero',
  'about',
  'skills',
  'projects',
  'bookshelf',
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
