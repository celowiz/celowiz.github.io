import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Papa from 'papaparse';
import type { Book } from '../types/Book';
import { FaSearch, FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { config } from '../config/secrets';
import { BookCard } from '../components/BookCard';
import styles from './Bookshelf.module.css';

const getUniqueCategories = (books: Book[]): string[] => {
    const categories = new Set(['All']);
    books.forEach(book => {
        if (book && book.category) {
            book.category.split(',')
                .map(cat => cat.trim())
                .filter(cat => cat) // Remove empty categories
                .forEach(cat => categories.add(cat));
        }
    });
    return Array.from(categories);
};

export default function Bookshelf() {
    const { t } = useTranslation();
    const [books, setBooks] = useState<Book[]>([]);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState('All');
    const [categories, setCategories] = useState<string[]>(['All']);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const extractISBNFromAmazonUrl = (amazonUrl: string | undefined) => {
        if (!amazonUrl) return null;
        
        try {
            const match = amazonUrl.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10,13})/i);
            return match ? match[1] : null;
        } catch (error) {
            console.warn('Error extracting ISBN:', error);
            return null;
        }
    };

    const fetchBookDataFromAPI = async (isbn: string) => {
        try {
            const response = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`);
            const data = await response.json();
            const bookData = data[`ISBN:${isbn}`];
            
            if (bookData) {
                return {
                    author: bookData.authors?.[0]?.name || 'Unknown Author',
                    pages: bookData.number_of_pages || 'N/A',
                    publisher: bookData.publishers?.[0]?.name || 'N/A',
                    publishDate: bookData.publish_date || 'N/A',
                    subjects: bookData.subjects?.slice(0, 3).map((s: any) => s.name) || [],
                    description: bookData.excerpts?.[0]?.text || 'No description available',
                    imageUrl: bookData.cover?.large || bookData.cover?.medium || bookData.cover?.small
                };
            }
        } catch (error) {
            console.error(`Error fetching data for ISBN ${isbn}:`, error);
        }
        return null;
    };

    useEffect(() => {
        // Carregar favoritos do localStorage
        const savedFavorites = localStorage.getItem('bookFavorites');
        if (savedFavorites) {
            setFavorites(new Set(JSON.parse(savedFavorites)));
        }

        // Carregar livros do CSV e enriquecer com dados da API
        const loadBooks = async () => {
            try {
                const response = await fetch('/books.csv');
                const csv = await response.text();
                const results = Papa.parse(csv, { header: true });
                const basicBooks = results.data as Book[];

                // Enriquecer cada livro com dados da API
                const enrichedBooks = await Promise.all(
                    basicBooks.map(async (book) => {
                        const isbn = extractISBNFromAmazonUrl(book.amazonUrl);
                        if (isbn) {
                            const apiData = await fetchBookDataFromAPI(isbn);
                            if (apiData) {
                                return {
                                    ...book,
                                    ...apiData,
                                    isbn
                                };
                            }
                        }
                        return book;
                    })
                );

                setBooks(enrichedBooks);
                setCategories(getUniqueCategories(enrichedBooks));
                setIsLoading(false);
            } catch (error) {
                console.error('Error loading books:', error);
                setIsLoading(false);
            }
        };

        loadBooks();
    }, []);

    const toggleFavorite = (bookId: string) => {
        setFavorites(prev => {
            const newFavorites = new Set(prev);
            if (newFavorites.has(bookId)) {
                newFavorites.delete(bookId);
            } else {
                newFavorites.add(bookId);
            }
            localStorage.setItem('bookFavorites', JSON.stringify([...newFavorites]));
            return newFavorites;
        });
    };

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

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const sortBooks = (books: Book[]) => {
        return [...books].sort((a, b) => {
            const comparison = a.title.localeCompare(b.title);
            return sortOrder === 'asc' ? comparison : -comparison;
        });
    };

    // Função para dividir livros em fileiras baseado no breakpoint
    const getBooksPerRow = () => {
        // Simula os breakpoints do Tailwind
        if (window.innerWidth >= 1280) return 6; // xl
        if (window.innerWidth >= 1024) return 5; // lg
        if (window.innerWidth >= 768) return 4;  // md
        if (window.innerWidth >= 640) return 3;  // sm
        return 2; // base
    };

    const organizeIntoRows = (books: Book[]) => {
        const booksPerRow = getBooksPerRow();
        const rows = [];
        for (let i = 0; i < books.length; i += booksPerRow) {
            rows.push(books.slice(i, i + booksPerRow));
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

                    {/* Filtros, Busca e Ordenação */}
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
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600'
                                        }`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Grade de Livros */}
                    {isLoading ? (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {organizeIntoRows(sortBooks(filteredBooks)).map((row, rowIndex) => (
                                <div key={rowIndex} className="relative">
                                    {/* Fileira de Livros */}
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
                                                    window.open(`${book.amazonUrl}?tag=${config.amazonAffiliateTag}`, '_blank', 'noopener,noreferrer');
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {/* Prateleira de Madeira para cada fileira */}
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
