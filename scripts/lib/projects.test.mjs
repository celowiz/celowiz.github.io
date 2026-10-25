import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (p) => fs.readFile(new URL(`../../${p}`, import.meta.url), 'utf8');
const src = await read('src/sections/Projects.tsx');
const pt = JSON.parse(await read('src/i18n/pt.json')).projects;
const en = JSON.parse(await read('src/i18n/en.json')).projects;
const sitemap = await read('public/sitemap.xml');

// Ids na ordem em que aparecem no array `projects` de Projects.tsx.
const ids = [...src.matchAll(/^\s+id: '([^']+)',$/gm)].map((m) => m[1]);
const techs = [...src.matchAll(/techs: \[([^\]]*)\]/g)].flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((t) => t[1]));

describe('Projetos do portfólio', () => {
  it('ordem aprovada, com o Quant Terminal em primeiro', () => {
    assert.deepEqual(ids, [
      'quant-terminal', 'monitor-b3', 'hmm-regimes', 'pairs-trading', 'rrg',
      'mercado-hoje', 'setores', 'lab', 'quant-notebooks', 'second-brain',
    ]);
  });

  it('cada id tem título e descrição em PT e EN, sem chaves sobrando', () => {
    for (const lang of [pt, en]) {
      assert.deepEqual(Object.keys(lang.items).sort(), [...ids].sort());
      for (const id of ids) {
        assert.ok(lang.items[id].title?.trim(), `${id}.title`);
        assert.ok(lang.items[id].description?.trim(), `${id}.description`);
      }
    }
    assert.ok(!Object.keys(pt).some((k) => /^\d+$/.test(k)), 'chaves numéricas antigas');
  });

  it('toda tech tem ícone (devicon local ou Lucide) e rótulo', () => {
    for (const t of new Set(techs)) {
      assert.match(src, new RegExp(`\\n  ${t}: `), t);
    }
  });

  it('sem nome de marca de terminal e com aviso educativo no Quant Terminal', () => {
    for (const lang of [pt, en]) {
      assert.doesNotMatch(JSON.stringify(lang.items['quant-terminal']), /bloomberg/i);
    }
    assert.match(pt.items['quant-terminal'].description, /sem recomendação de investimento/);
    assert.match(en.items['quant-terminal'].description, /not investment advice/);
  });

  it('subprojetos externos do Pages estão no sitemap', () => {
    for (const m of src.matchAll(/projectUrl: 'https:\/\/celowiz\.github\.io\/([^']+)'/g)) {
      assert.match(sitemap, new RegExp(`<loc>https://celowiz\\.github\\.io/${m[1]}</loc>`));
    }
  });
});
