export function asTimelineItems(value) {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item) =>
      item &&
      typeof item === 'object' &&
      item.company &&
      item.role &&
      item.period &&
      item.start
  );
}

export function mergeTimeline(experience, education) {
  const work = experience.map((item) => ({ ...item, kind: 'work' }));
  const school = education.map((item) => ({ ...item, kind: 'education' }));
  return [...work, ...school].sort((a, b) => {
    const byStart = b.start.localeCompare(a.start);
    if (byStart !== 0) return byStart;
    return a.company.localeCompare(b.company);
  });
}
