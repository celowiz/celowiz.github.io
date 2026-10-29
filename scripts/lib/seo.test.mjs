import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = (p) => fs.readFile(new URL(`../../${p}`, import.meta.url), 'utf8');
const html = await read('index.html');
const pt = JSON.parse(await read('src/i18n/pt.json'));
const manifest = JSON.parse(await read('public/manifest.json'));
const sitemap = await read('public/sitemap.xml');
const css = await read('src/index.css');

describe('SEO e PWA do portfólio', () => {
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);

  it('JSON-LD Person com os cargos atuais', () => {
    assert.equal(ld['@type'], 'Person');
    assert.deepEqual(ld.jobTitle, ['Quant Developer', 'Quant Trader', 'Quant Analyst']);
    assert.doesNotMatch(JSON.stringify(ld), /Web Developer/);
  });

  it('empresa e formação do JSON-LD batem com a timeline do site', () => {
    const current = pt.about.experience.find((e) => /presente/.test(e.period));
    assert.equal(ld.worksFor.name, current.company);
    const schools = pt.about.education.map((e) => e.company).sort();
    assert.deepEqual(ld.alumniOf.map((a) => a.name).sort(), schools);
    for (const cred of ld.hasCredential) {
      assert.ok(pt.about.education.some((e) => e.role === cred.name && e.company === cred.recognizedBy.name));
    }
  });

  it('manifest usa as cores atuais do site', () => {
    const ink = css.match(/--color-ink:\s*(#[0-9a-f]{6})/i)[1];
    assert.equal(manifest.theme_color, ink);
    assert.equal(manifest.background_color, ink);
    assert.match(html, new RegExp(`<meta name="theme-color" content="${ink}"`));
  });

  it('sitemap lista home, Second Brain, Lab, Mercado Hoje, Resultados e os subprojetos do Pages', () => {
    for (const path of ['', 'second-brain/', 'lab/', 'mercado-hoje/', 'resultados/', 'quant-terminal/', 'monitor-b3/', 'rrg/', 'hmm-regimes/', 'pairs-trading/', 'setores/', 'quant-notebooks/']) {
      assert.match(sitemap, new RegExp(`<loc>https://celowiz\\.github\\.io/${path}</loc>`));
    }
  });
});
