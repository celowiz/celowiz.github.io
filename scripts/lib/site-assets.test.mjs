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
