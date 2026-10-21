import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { BLOCKS, buildPayload, daysBetween, isFresh, summaryText, todayBrt, validateBlock, validatePayload } from './mercado-hoje.mjs';

const b3 = {
  schema: 1, as_of: '2026-10-20', final: true,
  bench: { price: 208295.98, chg: 0.01569, ret21: 0.12453, ifix_chg: 0.00358, ifix_ret21: 0.0566 },
  universe: { n: 170 }, breadth: { adv: 155, dec: 14 }, signals: { high52: { n: 18, items: [] } },
};
const hmm = { schema: 1, as_of: '2026-10-19', markets: { ibov: { regime: 'lateral', since: '2026-10-07', date: '2026-10-19', hist: { regimes: [] } } } };
const rrg = {
  schema: 1, as_of: '2026-10-19',
  presets: { setbr: { items: [{ t: 'IFNC', q: 'L' }, { t: 'ICON', q: 'L' }, { t: 'IMAT', q: 'G' }, { t: 'INDX', q: 'G' }, { t: 'IMOB', q: 'W' }] } },
};
const pairs = { schema: 1, as_of: '2026-10-19', funnel: { all_pairs: 7875 }, robust: [], robust_outside: 0 };
const now = new Date('2026-10-21T00:00:00Z'); // 20/10 21:00 BRT

describe('Mercado Hoje: validação', () => {
  it('aceita os quatro blocos de exemplo', () => {
    for (const [k, v] of Object.entries({ b3, hmm, rrg, pairs })) assert.deepEqual(validateBlock(k, v), [], k);
  });
  it('rejeita schema errado, sem data ou incompleto', () => {
    assert.ok(validateBlock('b3', { ...b3, schema: 2 }).length);
    assert.ok(validateBlock('rrg', { ...rrg, as_of: null }).length);
    assert.ok(validateBlock('pairs', { schema: 1, as_of: '2026-10-19' }).length);
    assert.ok(validateBlock('hmm', null).length);
  });
});

describe('Mercado Hoje: datas', () => {
  it('hoje em BRT e frescor por dias corridos', () => {
    assert.equal(todayBrt(now), '2026-10-20');
    assert.equal(daysBetween('2026-10-19', '2026-10-20'), 1);
    assert.ok(isFresh(rrg, '2026-10-26'));
    assert.ok(!isFresh(rrg, '2026-10-27'));
  });
});

describe('Mercado Hoje: texto por regras', () => {
  it('pt: Ibovespa, regime com a data própria e setores em defasagem', () => {
    const t = summaryText({ b3, hmm, rrg, pairs }, 'pt', '2026-10-20');
    assert.equal(
      t,
      'O Ibovespa subiu **1,57%** em 20/10, com 155 de 170 ações líquidas em alta e 18 novas máximas de 52 semanas. ' +
        'O modelo de regimes classifica o índice como **intermediário** desde 07/10 (fechamento de 19/10). ' +
        'Na rotação semanal, 2 de 5 setores estão em liderança; materiais básicos e industrial seguem em defasagem.'
    );
  });
  it('en: mesmo conteúdo em inglês', () => {
    const t = summaryText({ b3, hmm, rrg, pairs }, 'en', '2026-10-20');
    assert.match(t, /^The Ibovespa rose \*\*1\.57%\*\* on 10\/20, with 155 of 170 liquid stocks up/);
    assert.match(t, /basic materials and industrials are lagging\.$/);
  });
  it('pregão em andamento, queda, uma máxima, sem defasagem e par fora de ±2σ', () => {
    const t = summaryText(
      {
        b3: { ...b3, final: false, bench: { ...b3.bench, chg: -0.004 }, signals: { high52: { n: 1 } } },
        rrg: { ...rrg, presets: { setbr: { items: [{ t: 'IFNC', q: 'L' }] } } },
        pairs: { ...pairs, robust_outside: 1 },
      },
      'pt',
      '2026-10-20'
    );
    assert.match(t, /^O Ibovespa cai \*\*0,40%\*\* até agora no pregão de 20\/10/);
    assert.match(t, /1 nova máxima de 52 semanas/);
    assert.match(t, /1 de 1 setores estão em liderança\./);
    assert.match(t, /1 par cointegrado robusto está além de ±2σ/);
    assert.doesNotMatch(t, /regimes/);
  });
  it('blocos velhos ficam fora do texto', () => {
    assert.equal(summaryText({ b3, rrg: { ...rrg, as_of: '2026-10-01' } }, 'pt', '2026-10-20').includes('rotação'), false);
  });
});

describe('Mercado Hoje: payload e fallback', () => {
  it('usa o bloco anterior quando a fonte falha e marca missing sem anterior', () => {
    const prev = { schema: 1, blocks: { b3: null, rrg, hmm: null, pairs: null } };
    const p = buildPayload({ b3, rrg: new Error('404'), hmm: { schema: 9 }, pairs }, prev, now);
    assert.equal(p.sources.b3.status, 'ok');
    assert.equal(p.sources.rrg.status, 'fallback');
    assert.equal(p.blocks.rrg, rrg);
    assert.equal(p.sources.hmm.status, 'missing');
    assert.equal(p.blocks.hmm, null);
    assert.equal(p.as_of, '2026-10-20');
    assert.deepEqual(Object.keys(p.blocks), BLOCKS);
    assert.deepEqual(validatePayload(p), []);
    assert.ok(p.text.pt.startsWith('O Ibovespa subiu'));
  });
  it('payload sem nenhum bloco é inválido', () => {
    assert.ok(validatePayload(buildPayload({}, null, now)).length);
  });
  it('o JSON versionado é válido e pequeno', async () => {
    const raw = await fs.readFile(new URL('../../public/mercado-hoje.json', import.meta.url), 'utf8');
    assert.deepEqual(validatePayload(JSON.parse(raw)), []);
    assert.ok(raw.length < 40 * 1024, `${raw.length} bytes`);
  });
});

describe('Mercado Hoje: bloco do Banco Central', async () => {
  const { mergeBcb, isItemFresh } = await import('./mercado-hoje.mjs');
  const bcb = {
    schema: 1, as_of: '2026-10-20',
    series: {
      selic: { code: 432, value: 13.75, date: '2026-10-20', since: '2026-09-17' },
      cdi: { code: 4389, value: 13.65, date: '2026-10-19' },
      ipca12: { code: 13522, value: 4.58, date: '2026-09-01' },
      ptax: { code: 1, value: 5.014, date: '2026-10-20', prev: 5.0564, chg: -0.00839 },
    },
  };
  it('série que falhou mantém o último valor publicado', () => {
    const got = { ...bcb, series: { selic: bcb.series.selic, ptax: bcb.series.ptax } };
    const m = mergeBcb(got, { series: { cdi: { value: 13.6, date: '2026-10-16' }, ipca12: bcb.series.ipca12 } });
    assert.equal(m.status, 'partial');
    assert.deepEqual(m.kept, ['cdi', 'ipca12']);
    assert.equal(m.block.series.cdi.value, 13.6);
    assert.equal(m.block.as_of, '2026-10-20');
  });
  it('sem nada novo usa o anterior; sem nada some', () => {
    assert.equal(mergeBcb(null, bcb).status, 'fallback');
    assert.equal(mergeBcb(null, null).block, null);
  });
  it('payload inclui o bloco bcb e respeita o frescor por série', () => {
    const p = buildPayload({ b3, bcb }, null, now);
    assert.equal(p.sources.bcb.status, 'ok');
    assert.equal(p.blocks.bcb.series.ptax.value, 5.014);
    assert.ok(isItemFresh('ipca12', bcb.series.ipca12, '2026-11-10'));
    assert.ok(!isItemFresh('ptax', bcb.series.ptax, '2026-11-10'));
  });
});
