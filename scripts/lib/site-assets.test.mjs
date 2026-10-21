import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { bleedIconSvg } from '../generate-site-assets.mjs';

const favicon = await fs.readFile(new URL('../../public/images/favicon.svg', import.meta.url), 'utf8');

describe('ícones do site (prebuild)', () => {
  it('gera o ícone com sangria a partir do favicon MW, sem o fundo arredondado original', () => {
    const svg = bleedIconSvg(favicon, 0.75);
    assert.match(svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 64 64">/);
    assert.match(svg, /<rect width="64" height="64" fill="#0b0d10"\/>/);
    assert.match(svg, /scale\(0\.75\)/);
    assert.equal((svg.match(/<rect/g) ?? []).length, 1);
    assert.equal((svg.match(/<svg/g) ?? []).length, 1);
  });

  it('não volta a desenhar o ícone antigo "DEV"', async () => {
    const source = await fs.readFile(new URL('../generate-site-assets.mjs', import.meta.url), 'utf8');
    assert.doesNotMatch(source, />DEV</);
    assert.match(source, /favicon\.svg/);
  });
});

describe('imagens de preview social (og:image)', async () => {
  const { OG_WIDTH, OG_HEIGHT, homeOgSvg, secondBrainOgSvg, labOgSvg, mercadoHojeOgSvg, loadOgFonts } = await import('./og-images.mjs');
  const fonts = await loadOgFonts();
  const brain = await fs.readFile(new URL('../../public/images/second-brain/favicon.svg', import.meta.url), 'utf8');

  for (const [name, svg] of [
    ['home', homeOgSvg(fonts)],
    ['second-brain', secondBrainOgSvg(fonts, brain)],
    ['lab', labOgSvg(fonts)],
    ['mercado-hoje', mercadoHojeOgSvg(fonts)],
  ]) {
    it(`${name}: 1200×630, texto em paths (independe de fontes do sistema) e sem NaN`, () => {
      assert.equal(OG_WIDTH, 1200);
      assert.equal(OG_HEIGHT, 630);
      assert.match(svg, /width="1200" height="630"/);
      assert.doesNotMatch(svg, /<text/);
      assert.doesNotMatch(svg, /NaN/);
      assert.match(svg, /#050506/);
      assert.match(svg, /#2dd4bf/);
    });
  }

  it('é determinística (mesmas partículas a cada build)', () => {
    assert.equal(homeOgSvg(fonts), homeOgSvg(fonts));
  });

  for (const [page, image] of [
    ['../../index.html', 'portfolio-preview.png'],
    ['../../second-brain/index.html', 'og-second-brain.png'],
    ['../../lab/index.html', 'og-lab.png'],
    ['../../mercado-hoje/index.html', 'og-mercado-hoje.png'],
  ]) {
    it(`${page.replace('../../', '')}: og/twitter image absolutas, com tamanho e alt`, async () => {
      const html = await fs.readFile(new URL(page, import.meta.url), 'utf8');
      const meta = (attr, key) => html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]+)"`))?.[1];
      for (const url of [meta('property', 'og:image'), meta('name', 'twitter:image')]) {
        assert.ok(url?.startsWith(`https://celowiz.github.io/images/${image}`), url);
      }
      assert.equal(meta('property', 'og:image:width'), '1200');
      assert.equal(meta('property', 'og:image:height'), '630');
      assert.ok(meta('property', 'og:image:alt'));
      assert.ok(meta('name', 'twitter:image:alt'));
      assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
      const { size } = await fs.stat(new URL(`../../public/images/${image}`, import.meta.url));
      assert.ok(size < 300 * 1024, `${image} tem ${size} bytes`);
    });
  }
});
