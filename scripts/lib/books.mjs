export const AFFILIATE_TAG = 'celowiz-20';
export const BOOKS_CSV_URL =
  'https://raw.githubusercontent.com/celowiz/second-brain/main/books.csv';

export function normalizeIsbn(isbn) {
  return String(isbn ?? '').replace(/[-\s]/g, '').trim();
}

export function withAffiliateTag(amazonUrl, tag = AFFILIATE_TAG) {
  const url = new URL(amazonUrl);
  url.searchParams.set('tag', tag);
  return url.toString();
}

export function extractAsin(amazonUrl) {
  if (!amazonUrl) return null;
  const match = String(amazonUrl).match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return match ? match[1] : null;
}

export function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

export function parseBooksCsv(csvText) {
  const text = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });
    rows.push(row);
  }

  return rows;
}

export function mapBookRow(row) {
  const isbn = normalizeIsbn(row.isbn);
  const categories = String(row.categories ?? '')
    .split(';')
    .map((cat) => cat.trim())
    .filter(Boolean);

  return {
    id: isbn,
    isbn,
    title: String(row.title ?? '').trim(),
    amazonUrl: withAffiliateTag(row.amazon),
    category: categories.join(', '),
    categories,
    asin: extractAsin(row.amazon),
    cover: `/covers/${isbn}.webp`,
  };
}

export function mapBooks(rows) {
  return rows
    .filter((row) => normalizeIsbn(row.isbn) && String(row.title ?? '').trim())
    .map(mapBookRow);
}
