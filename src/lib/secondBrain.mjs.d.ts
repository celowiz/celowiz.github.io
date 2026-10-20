export const ALL: 'all';
export const NO_FLAGS: 'ok';

export type FilterState = { q: string; cat: string; status: string };
export type FilterableItem = { n: string; d: string; x: string; c: string; f: string[] };

export function normalizeText(text: string): string;
export function readUrlState(search: string): FilterState;
export function toSearch(state: FilterState): string;
export function matchItem(item: FilterableItem, state: FilterState, subLabel?: string): boolean;
export function highlightParts(text: string, query: string): { text: string; hit: boolean }[];
export function domId(prefix: string, id: string): string;
