import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Book } from '../types/Book';
import { FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { BookCard } from '../components/BookCard';
import styles from './Bookshelf.module.css';

const getUniqueCategories = (books: Book[]): string[] => {
    const categories = new Set(['All']);
    books.forEach(book => {
        if (book && book.category) {
            book.category.split(',')
                .map(cat => cat.trim())
                .filter(cat => cat)
                .forEach(cat => categories.add(cat));
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

    useEffect(() => {
        const loadBooks = async () => {
            try {
                const response = await fetch('/books.json');
                const data = (await response.json()) as Book[];
                setBooks(Array.isArray(data) ? data : []);
                setCategories(getUniqueCategories(Array.isArray(data) ? data : []));
            } catch (error) {
                console.error('Error loading books:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadBooks();
    }, []);

    const filteredBooks = books.filter(book => {
        if (!book || typeof book !== 'object') return false;

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
            (book.title?.toLowerCase().includes(searchLower) ?? false) ||
            (book.author?.toLowerCase().includes(searchLower) ?? false) ||
            (book.description?.toLowerCase().includes(searchLower) ?? false);
            
        const bookCategories = book.category ? book.category.split(',').map(cat => cat.trim()) : [];
        const matchesCategory = filter === 'All' || bookCategories.includes(filter);
        return matchesSearch && matchesCategory;
    });

    const sortBooks = (booksToSort: Book[]) => {
        return [...booksToSort].sort((a, b) => {
            const comparison = a.title.localeCompare(b.title);
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    };

    const getBooksPerRow = () => {
        if (window.innerWidth >= 1280) return 6;
        if (window.innerWidth >= 1024) return 5;
        if (window.innerWidth >= 768) return 4;
        if (window.innerWidth >= 640) return 3;
        return 2;
    };

    const organizeIntoRows = (booksToOrganize: Book[]) => {
        const booksPerRow = getBooksPerRow();
        const rows = [];
        for (let i = 0; i < booksToOrganize.length; i += booksPerRow) {
            rows.push(booksToOrganize.slice(i, i + booksPerRow));
        }
        return rows;
    };

    return (
        <div className="bg-gray-900">

            <section id="bookshelf" className="py-8 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center text-white mb-6 sm:mb-8">
                        {t('bookshelf.title')}
                    </h2>
                    <p className="text-gray-300 text-center mb-8 sm:mb-12 max-w-2xl mx-auto text-sm sm:text-base">
                        {t('bookshelf.description')}
                    </p>

                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                placeholder={t('bookshelf.searchPlaceholder')}
                                className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg pl-10 border border-gray-600 focus:border-blue-400 focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <FaSearch className="absolute left-3 top-3 text-gray-400" />
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-800 text-gray-200 hover:bg-gray-700 rounded-lg text-sm sm:text-base"
                            >
                                {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                                {sortOrder === 'asc' ? 'A → Z' : 'Z → A'}
                            </button>
                            
                            <div className="flex gap-2 flex-wrap">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setFilter(cat)}
                                        className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base transition-colors ${
                                            filter === cat
                                                ? 'bg-blue-700 text-white'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {organizeIntoRows(sortBooks(filteredBooks)).map((row, rowIndex) => (
                                <div key={rowIndex} className="relative">
                                    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 p-4 sm:p-6 pb-6 rounded-lg ${styles.shelf}`}>
                                        {row.map(book => (
                                            <BookCard
                                                key={book.id}
                                                book={book}
                                                onBuyClick={() => {
                                                    if (window.gtag) {
                                                        window.gtag('event', 'click_book', {
                                                            event_category: 'Bookshelf',
                                                            event_label: book.title
                                                        });
                                                    }
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <div className={styles.shelfBottom}></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
