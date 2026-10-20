import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';

// Carrega o public/sw.js num contexto falso para testar a allowlist de caminhos.
const source = await fs.readFile(new URL('../../public/sw.js', import.meta.url), 'utf8');
const self = { addEventListener() {}, location: { origin: 'https://celowiz.github.io' } };
vm.runInNewContext(source, { self, caches: {}, fetch() {}, URL, Response: {} });
const route = self.__swRoute;

describe('service worker: allowlist do portfólio', () => {
  it('usa versão v5 e prefixo próprio de cache', () => {
    assert.match(source, /CACHE_VERSION = 'v5'/);
  });

  it('intercepta as páginas e os dados do portfólio', () => {
    assert.equal(route('/', true), 'page');
    assert.equal(route('/second-brain/', true), 'page');
    assert.equal(route('/books.json', false), 'data');
    assert.equal(route('/second-brain.json', false), 'data');
    assert.equal(route('/assets/main-abc123.js', false), 'immutable');
    assert.equal(route('/covers/9780470411148.webp', false), 'asset');
    assert.equal(route('/images/second-brain/favicon-32.png', false), 'asset');
    assert.equal(route('/fonts/inter-latin-wght-normal.woff2', false), 'asset');
  });

  for (const path of [
    '/monitor-b3/',
    '/monitor-b3/data/latest_br.json',
    '/monitor-b3/assets/index-D8M5F-KA.js',
    '/rrg/data/prices.json',
    '/rrg/js/app.js',
    '/hmm-regimes/data/hmm_ibov_d3.json',
    '/pairs-trading/',
    '/quant-notebooks/index.html',
    '/um-repo-novo/qualquer.json',
  ]) {
    it(`não intercepta ${path} (subprojeto ou outro repo do Pages)`, () => {
      assert.equal(route(path, path.endsWith('/') || path.endsWith('.html')), null);
      assert.equal(route(path, false), null);
    });
  }

  it('não intercepta navegação para caminhos desconhecidos', () => {
    assert.equal(route('/pagina-que-nao-existe', true), null);
  });
});
