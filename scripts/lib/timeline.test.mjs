import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { asTimelineItems, mergeTimeline } from './timeline.mjs';

describe('asTimelineItems', () => {
  it('ignores non-arrays and incomplete rows', () => {
    assert.deepEqual(asTimelineItems(null), []);
    assert.deepEqual(
      asTimelineItems([{ company: 'X', role: 'Y', period: 'Z', start: '2020-01' }, { company: 'Nope' }]),
      [{ company: 'X', role: 'Y', period: 'Z', start: '2020-01' }]
    );
  });
});

describe('mergeTimeline', () => {
  it('mixes work and education newest-start first', () => {
    const merged = mergeTimeline(
      [
        { company: 'Novus', role: 'Trader', period: '2018–2025', start: '2018-02' },
        { company: 'Oz Capital', role: 'Partner', period: '2026–', start: '2026-01' },
      ],
      [
        { company: 'PUC-Rio', role: 'B.S.', period: '2012–2017', start: '2012-01' },
        { company: 'FGV-RJ', role: 'M.S.', period: '2021–2023', start: '2021-01' },
      ]
    );

    assert.deepEqual(
      merged.map((item) => `${item.kind}:${item.company}`),
      ['work:Oz Capital', 'education:FGV-RJ', 'work:Novus', 'education:PUC-Rio']
    );
  });
});
