import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPayload,
  parseSecondBrainReadme,
  slugify,
  splitHeading,
  titleFromUrl,
  validatePayload,
} from './second-brain.mjs';

const SAMPLE = `# 🧠 Second Brain
## 📑 Table of Contents <!-- omit in toc -->
- [📚 Books](#-books)
## 📚 Books
| Cover | Title |
- [Não é item](https://example.com/books)
## 🎓 Learning Materials
### 🏛️ Financial Markets Fundamentals
- [CME: Education Center](https://www.cmegroup.com/education.html) \`🤖 bloqueia bot\`
- [Coursera: Financial Markets by Yale](https://www.coursera.org/learn/financial-markets-global) - Curso de **Robert Shiller**.
  - [Aula 1](https://www.coursera.org/learn/x/lecture/1) — inclui [slides](https://a.b/c)
## 🇧🇷 Open Source Brasil
- [dude333/rapina](https://github.com/dude333/rapina) - Relatórios da B3.
- https://github.com/QuantInsti/blueshift-demo-strategies
- https://letianzj.github.io/mean-reversion.html
- neurotrader: https://www.youtube.com/@neurotrader888/videos
- Yahoo Finance, Polygon.io (nota sem link)
## 🗂️ Curation Backlog
- [Vazio](https://example.com/empty)
`;

describe('splitHeading / slugify', () => {
  it('separa emoji do nome', () => {
    assert.deepEqual(splitHeading('🇧🇷 Open Source Brasil'), { emoji: '🇧🇷', name: 'Open Source Brasil' });
    assert.deepEqual(splitHeading('Career'), { emoji: '', name: 'Career' });
    assert.deepEqual(splitHeading('📑 Table of Contents <!-- omit in toc -->').name, 'Table of Contents');
  });
  it('gera slugs estáveis', () => {
    assert.equal(slugify('Data Sources & APIs'), 'data-sources-apis');
    assert.equal(slugify('Macro: Europe'), 'macro-europe');
  });
});

describe('titleFromUrl', () => {
  it('usa owner/repo no GitHub', () => {
    assert.equal(titleFromUrl('https://github.com/QuantInsti/blueshift-demo-strategies'), 'QuantInsti/blueshift-demo-strategies');
  });
  it('usa o último trecho do caminho', () => {
    assert.equal(titleFromUrl('https://letianzj.github.io/mean-reversion.html'), 'Mean reversion');
    assert.equal(titleFromUrl('https://example.com/'), 'example.com');
  });
});

describe('parseSecondBrainReadme', () => {
  const { categories, items } = parseSecondBrainReadme(SAMPLE);
  it('ignora sumário, livros e backlog', () => {
    assert.deepEqual(categories.map((c) => c.id), ['learning-materials', 'open-source-brasil']);
    assert.ok(!items.some((i) => i.u.includes('example.com')));
  });
  it('lê links, descrições, flags e nível', () => {
    const cme = items.find((i) => i.n === 'CME: Education Center');
    assert.deepEqual(cme.f, ['bot']);
    assert.equal(cme.d, 'cmegroup.com');
    assert.equal(cme.x, '');
    const yale = items.find((i) => i.n.includes('Yale'));
    assert.equal(yale.x, 'Curso de Robert Shiller.');
    assert.equal(yale.s, 'learning-materials/financial-markets-fundamentals');
    const child = items.find((i) => i.n === 'Aula 1');
    assert.equal(child.lvl, 1);
    assert.equal(child.x, 'inclui slides');
  });
  it('trata linhas de URL solta e ignora notas sem link', () => {
    const osb = items.filter((i) => i.c === 'open-source-brasil');
    assert.deepEqual(osb.map((i) => i.n), [
      'dude333/rapina',
      'QuantInsti/blueshift-demo-strategies',
      'Mean reversion',
      'neurotrader',
    ]);
    assert.equal(osb[0].s, 'open-source-brasil/geral');
  });
});

describe('validatePayload', () => {
  it('rejeita README sem conteúdo suficiente', () => {
    assert.ok(validatePayload(buildPayload(SAMPLE)).length > 0);
  });
  it('aceita o JSON versionado em public/second-brain.json', async () => {
    const raw = await readFile(new URL('../../public/second-brain.json', import.meta.url), 'utf8');
    const payload = JSON.parse(raw);
    assert.deepEqual(validatePayload(payload), []);
    assert.equal(payload.counts.links, payload.items.length);
    assert.equal(payload.counts.categories, payload.categories.length);
  });
});
