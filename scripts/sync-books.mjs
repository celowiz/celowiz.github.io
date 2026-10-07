import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import {
  BOOKS_CSV_URL,
  mapBooks,
  parseBooksCsv,
} from './lib/books.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const COVERS_DIR = path.join(PUBLIC_DIR, 'covers');
const BOOKS_JSON = path.join(PUBLIC_DIR, 'books.json');
const PLACEHOLDER = path.join(COVERS_DIR, 'placeholder.webp');

const COVER_WIDTH = 180;
const COVER_HEIGHT = 270;
const MIN_BYTES = 1500;
const OL_BATCH = 20;

function openLibraryCoverUrl(isbn) {
  return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;
}

function amazonCoverUrl(asin) {
  return `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
}

async function downloadBuffer(url) {
  const response = await fetch(url, {
    redirect: 'follow',
    headers: { 'User-Agent': 'celowiz.github.io-books-sync/1.0' },
  });
  if (!response.ok) return null;
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < MIN_BYTES) return null;
  return buffer;
}

async function toCoverWebp(input) {
  return sharp(input)
    .resize(COVER_WIDTH, COVER_HEIGHT, { fit: 'cover', position: 'center' })
    .webp({ quality: 82 })
    .toBuffer();
}

async function ensurePlaceholder() {
  await fs.mkdir(COVERS_DIR, { recursive: true });
  const jpgPath = path.join(PUBLIC_DIR, 'placeholder-book.jpg');
  const source = await fs
    .readFile(jpgPath)
    .catch(() => null);

  const webp = source
    ? await toCoverWebp(source)
    : await sharp({
        create: {
          width: COVER_WIDTH,
          height: COVER_HEIGHT,
          channels: 3,
          background: { r: 31, g: 41, b: 55 },
        },
      })
        .webp({ quality: 80 })
        .toBuffer();

  await fs.writeFile(PLACEHOLDER, webp);
}

async function fetchOpenLibraryCovers(isbns) {
  const covers = new Map();
  for (let i = 0; i < isbns.length; i += OL_BATCH) {
    const batch = isbns.slice(i, i + OL_BATCH);
    const bibkeys = batch.map((isbn) => `ISBN:${isbn}`).join(',');
    const url = `https://openlibrary.org/api/books?bibkeys=${encodeURIComponent(bibkeys)}&format=json&jscmd=data`;
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'celowiz.github.io-books-sync/1.0' },
      });
      if (!response.ok) continue;
      const data = await response.json();
      for (const isbn of batch) {
        const entry = data[`ISBN:${isbn}`];
        const coverUrl = entry?.cover?.large || entry?.cover?.medium || entry?.cover?.small;
        if (coverUrl) covers.set(isbn, coverUrl);
      }
    } catch {
      // Fall back to per-ISBN cover URLs below.
    }
  }
  return covers;
}

async function resolveCover(book, olCovers) {
  const candidates = [];
  if (olCovers.get(book.isbn)) candidates.push(olCovers.get(book.isbn));
  candidates.push(openLibraryCoverUrl(book.isbn));
  if (book.asin) candidates.push(amazonCoverUrl(book.asin));

  for (const url of candidates) {
    try {
      const buffer = await downloadBuffer(url);
      if (buffer) return buffer;
    } catch {
      // try next source
    }
  }
  return null;
}

async function fetchCsv() {
  const response = await fetch(BOOKS_CSV_URL, {
    headers: { 'User-Agent': 'celowiz.github.io-books-sync/1.0' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch books.csv: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export async function syncBooks() {
  await ensurePlaceholder();
  const csv = await fetchCsv();
  const books = mapBooks(parseBooksCsv(csv));
  const olCovers = await fetchOpenLibraryCovers(books.map((book) => book.isbn));

  for (const book of books) {
    const dest = path.join(COVERS_DIR, `${book.isbn}.webp`);
    const image = await resolveCover(book, olCovers);
    const webp = image ? await toCoverWebp(image) : await fs.readFile(PLACEHOLDER);
    await fs.writeFile(dest, webp);
    console.log(`${image ? 'cover' : 'placeholder'}  ${book.isbn}  ${book.title}`);
  }

  const payload = books.map(({ asin, ...rest }) => rest);
  await fs.writeFile(BOOKS_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  console.log(`Wrote ${books.length} books to ${path.relative(ROOT, BOOKS_JSON)}`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  syncBooks().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
