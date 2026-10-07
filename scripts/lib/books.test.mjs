import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AFFILIATE_TAG,
  extractAsin,
  mapBookRow,
  mapBooks,
  normalizeIsbn,
  parseBooksCsv,
  withAffiliateTag,
} from './books.mjs';

describe('normalizeIsbn', () => {
  it('strips hyphens and spaces from ISBN', () => {
    assert.equal(normalizeIsbn('978-0470411148'), '9780470411148');
    assert.equal(normalizeIsbn('978 0061241710'), '9780061241710');
  });
});

describe('AFFILIATE_TAG', () => {
  it('is the Amazon BR Associates ID celowiz05-20', () => {
    assert.equal(AFFILIATE_TAG, 'celowiz05-20');
  });

  it('is present on every amazon.com.br link in public/books.json', async () => {
    const raw = await readFile(new URL('../../public/books.json', import.meta.url), 'utf8');
    const books = JSON.parse(raw);
    assert.ok(Array.isArray(books) && books.length > 0);
    for (const book of books) {
      const url = new URL(book.amazonUrl);
      assert.equal(url.hostname, 'www.amazon.com.br');
      assert.equal(url.searchParams.get('tag'), AFFILIATE_TAG);
    }
  });
});

describe('withAffiliateTag', () => {
  it('appends the affiliate tag when the URL has no query string', () => {
    const href = withAffiliateTag(
      'https://www.amazon.com.br/gp/product/6559322696/'
    );
    const url = new URL(href);
    assert.equal(url.searchParams.get('tag'), AFFILIATE_TAG);
    assert.match(href, /tag=celowiz05-20/);
  });

  it('preserves existing query strings and sets tag', () => {
    const href = withAffiliateTag(
      'https://www.amazon.com/dp/0132350882?psc=1&ref=abc'
    );
    const url = new URL(href);
    assert.equal(url.searchParams.get('psc'), '1');
    assert.equal(url.searchParams.get('ref'), 'abc');
    assert.equal(url.searchParams.get('tag'), 'celowiz05-20');
  });

  it('replaces an existing tag instead of duplicating it', () => {
    const href = withAffiliateTag(
      'https://www.amazon.com/dp/0132350882?tag=other-20'
    );
    const url = new URL(href);
    assert.equal(url.searchParams.getAll('tag').join(','), 'celowiz05-20');
  });
});

describe('extractAsin', () => {
  it('reads ASIN from /dp/ and /gp/product/ paths', () => {
    assert.equal(
      extractAsin('https://www.amazon.com.br/foo/dp/1119800064/'),
      '1119800064'
    );
    assert.equal(
      extractAsin('https://www.amazon.com.br/gp/product/B086Y6H6YG/'),
      'B086Y6H6YG'
    );
  });
});

describe('parseBooksCsv + mapBookRow', () => {
  const csv = [
    'isbn,title,amazon,categories',
    '"978-0470411148","Quantitative Trading","https://www.amazon.com.br/foo/dp/1119800064/","Quant"',
    '"978-1098122478","Hands-On Machine Learning, Keras","https://www.amazon.com.br/bar/dp/1098125975/","Data Science;Programming;Python"',
  ].join('\n');

  it('parses quoted CSV including titles with commas', () => {
    const rows = parseBooksCsv(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[1].title, 'Hands-On Machine Learning, Keras');
    assert.equal(rows[1].categories, 'Data Science;Programming;Python');
  });

  it('maps isbn without hyphens, affiliate href, and semicolon categories', () => {
    const book = mapBookRow(parseBooksCsv(csv)[1]);
    assert.equal(book.id, '9781098122478');
    assert.equal(book.isbn, '9781098122478');
    assert.equal(book.title, 'Hands-On Machine Learning, Keras');
    assert.equal(book.category, 'Data Science, Programming, Python');
    assert.deepEqual(book.categories, ['Data Science', 'Programming', 'Python']);
    assert.equal(new URL(book.amazonUrl).searchParams.get('tag'), 'celowiz05-20');
    assert.equal(book.cover, '/covers/9781098122478.webp');
  });

  it('mapBooks skips empty rows', () => {
    const books = mapBooks([...parseBooksCsv(csv), { isbn: '', title: '', amazon: '' }]);
    assert.equal(books.length, 2);
  });
});
