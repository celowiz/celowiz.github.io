import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, ArrowDownAZ, ArrowUpAZ } from 'lucide-react';
import type { Book } from '../types/Book';
import { BookCard } from '../components/BookCard';
import styles from './Bookshelf.module.css';

const getUniqueCategories = (books: Book[]): string[] => {
  const categories = new Set<string>(['All']);
  books.forEach((book) => {
    if (book?.category) {
      book.category
        .split(',')
        .map((cat) => cat.trim())
        .filter(Boolean)
        .forEach((cat) => categories.add(cat));
    }
  });
  return Array.from(categories);
};

export default function Bookshelf() {
  const { t } = useTranslation();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [booksPerRow, setBooksPerRow] = useState(2);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const response = await fetch('/books.json');
        const data = (await response.json()) as Book[];
        const list = Array.isArray(data) ? data : [];
        setBooks(list);
        setCategories(getUniqueCategories(list));
      } catch (error) {
        console.error('Error loading books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBooks();
  }, []);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth >= 1280) setBooksPerRow(6);
      else if (window.innerWidth >= 1024) setBooksPerRow(5);
      else if (window.innerWidth >= 768) setBooksPerRow(4);
      else if (window.innerWidth >= 640) setBooksPerRow(3);
      else setBooksPerRow(2);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  const filteredBooks = books.filter((book) => {
    if (!book || typeof book !== 'object') return false;

    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (book.title?.toLowerCase().includes(searchLower) ?? false) ||
      (book.author?.toLowerCase().includes(searchLower) ?? false) ||
      (book.description?.toLowerCase().includes(searchLower) ?? false);

    const bookCategories = book.category ? book.category.split(',').map((cat) => cat.trim()) : [];
    const matchesCategory = filter === 'All' || bookCategories.includes(filter);
    return matchesSearch && matchesCategory;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    const comparison = a.title.localeCompare(b.title);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const rows: Book[][] = [];
  for (let i = 0; i < sortedBooks.length; i += booksPerRow) {
    rows.push(sortedBooks.slice(i, i + booksPerRow));
  }

  const controlClass =
    'h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-paper placeholder:text-paper/40 focus:border-teal focus:outline-none';

  return (
    <section id="bookshelf" className="scroll-mt-28 bg-ink py-24 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center font-serif text-4xl tracking-tight text-paper sm:text-5xl">
          {t('bookshelf.title')}
        </h2>
        <p className="mx-auto mt-6 mb-10 max-w-2xl text-center text-paper/70">
          {t('bookshelf.description')}
        </p>

        <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="relative min-w-0 flex-1 lg:w-72 lg:flex-none">
              <input
                type="text"
                placeholder={t('bookshelf.searchPlaceholder')}
                className={`${controlClass} w-full pl-10`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-paper/40" />
            </div>

            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className={`${controlClass} inline-flex shrink-0 items-center gap-2 hover:border-white/20`}
            >
              {sortOrder === 'asc' ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
              {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
            </button>
          </div>

          <div className="flex h-10 min-w-0 flex-1 flex-nowrap items-center gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilter(cat)}
                className={`h-10 shrink-0 rounded-lg px-3 text-sm whitespace-nowrap transition-colors ${
                  filter === cat
                    ? 'bg-teal/20 text-teal'
                    : 'border border-white/10 bg-white/5 text-paper/70 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-b-2 border-teal" />
          </div>
        ) : (
          <div className="space-y-8">
            {rows.map((row, rowIndex) => (
              <div key={rowIndex} className="relative">
                <div
                  className={`grid grid-cols-2 items-end gap-4 rounded-t-lg px-4 pt-4 pb-0 sm:grid-cols-3 sm:gap-6 sm:px-6 sm:pt-6 sm:pb-0 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 ${styles.shelf}`}
                >
                  {row.map((book) => (
                    <BookCard
                      key={book.id}
                      book={book}
                      onBuyClick={() => {
                        if (window.gtag) {
                          window.gtag('event', 'click_book', {
                            event_category: 'Bookshelf',
                            event_label: book.title,
                          });
                        }
                      }}
                    />
                  ))}
                </div>
                <div className={styles.shelfBottom} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
