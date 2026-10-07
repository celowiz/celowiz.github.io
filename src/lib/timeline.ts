export type TimelineKind = 'work' | 'education';

export type TimelineSourceItem = {
  company: string;
  role: string;
  period: string;
  start: string;
};

export type TimelineEntry = TimelineSourceItem & { kind: TimelineKind };

export function asTimelineItems(value: unknown): TimelineSourceItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is TimelineSourceItem => {
    if (!item || typeof item !== 'object') return false;
    const row = item as TimelineSourceItem;
    return Boolean(row.company && row.role && row.period && row.start);
  });
}

export function mergeTimeline(
  experience: TimelineSourceItem[],
  education: TimelineSourceItem[],
): TimelineEntry[] {
  const work = experience.map((item) => ({ ...item, kind: 'work' as const }));
  const school = education.map((item) => ({ ...item, kind: 'education' as const }));
  return [...work, ...school].sort((a, b) => {
    const byStart = b.start.localeCompare(a.start);
    if (byStart !== 0) return byStart;
    return a.company.localeCompare(b.company);
  });
}
