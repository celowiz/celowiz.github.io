import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { domId, highlightParts, matchItem, readUrlState, toSearch } from './secondBrain.mjs';

const item = { n: 'B3: Introdução a Estratégias de Momentum', d: 'edu.b3.com.br', x: 'Curso gratuito.', c: 'learning-materials', f: [] };
const flagged = { n: 'CME', d: 'cmegroup.com', x: '', c: 'learning-materials', f: ['bot'] };

describe('URL state', () => {
  it('lê e escreve q, cat e status', () => {
    const state = readUrlState('?q=pairs&cat=quant-research&status=bot');
    assert.deepEqual(state, { q: 'pairs', cat: 'quant-research', status: 'bot' });
    assert.equal(toSearch(state), '?q=pairs&cat=quant-research&status=bot');
    assert.equal(toSearch({ q: '', cat: 'all', status: 'all' }), '');
  });
});

describe('matchItem', () => {
  it('ignora acentos e maiúsculas, e busca no domínio e na subcategoria', () => {
    assert.ok(matchItem(item, { q: 'introducao', cat: 'all', status: 'all' }));
    assert.ok(matchItem(item, { q: 'B3.COM', cat: 'all', status: 'all' }));
    assert.ok(matchItem(item, { q: 'fundamentals', cat: 'all', status: 'all' }, 'Financial Markets Fundamentals'));
    assert.ok(!matchItem(item, { q: 'kalman', cat: 'all', status: 'all' }));
  });
  it('filtra por categoria e status', () => {
    assert.ok(!matchItem(item, { q: '', cat: 'tools', status: 'all' }));
    assert.ok(matchItem(flagged, { q: '', cat: 'all', status: 'bot' }));
    assert.ok(!matchItem(item, { q: '', cat: 'all', status: 'bot' }));
    assert.ok(matchItem(item, { q: '', cat: 'all', status: 'ok' }));
    assert.ok(!matchItem(flagged, { q: '', cat: 'all', status: 'ok' }));
  });
});

describe('highlightParts', () => {
  it('marca o termo preservando os acentos do texto', () => {
    const parts = highlightParts('Introdução à B3', 'introducao');
    assert.deepEqual(parts[0], { text: 'Introdução', hit: true });
  });
  it('devolve o texto inteiro sem busca', () => {
    assert.deepEqual(highlightParts('abc', ''), [{ text: 'abc', hit: false }]);
  });
  it('gera ids de DOM seguros', () => {
    assert.equal(domId('sub', 'tools/github-utilities'), 'sub-tools--github-utilities');
  });
});
