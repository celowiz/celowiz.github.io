import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAmazon } from '@fortawesome/free-brands-svg-icons';
import { useTranslation } from 'react-i18next';
import type { Book } from '../types/Book';
import styles from './BookCard.module.css';

interface BookCardProps {
    book: Book;
    onBuyClick: () => void;
}

export function BookCard({ book, onBuyClick }: BookCardProps) {
    const { t } = useTranslation();
    const [isFlipped, setIsFlipped] = useState(false);

    const handleCardClick = () => {
        setIsFlipped(!isFlipped);
    };

    return (
        <div className={`${styles.bookWrapper} group cursor-pointer`} onClick={handleCardClick}>
            <div className={`${styles.book} transform-gpu ${isFlipped ? 'rotate-y-180' : ''} group-hover:rotate-y-180`}>
                {/* Frente do Livro */}
                <div className="absolute inset-0 backface-hidden rounded-lg overflow-hidden">
                    <img
                        src={book.imageUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                </div>

                {/* Verso do Livro */}
                <div className={`${styles.bookBack} absolute inset-0 backface-hidden rounded-lg rotate-y-180 overflow-hidden`}>
                    <div className="p-2 sm:p-3 h-full flex flex-col items-center justify-between text-center">
                        <h3 className="text-xs sm:text-sm font-bold text-white mb-1 sm:mb-2 line-clamp-2 leading-tight">
                            {book.title}
                        </h3>
                        <p className="text-xs text-gray-300 mb-1 sm:mb-2 line-clamp-1">
                            {book.author}
                        </p>
                        <div className="flex flex-wrap justify-center gap-1 mb-2 max-h-12 overflow-hidden">
                            {book.category?.split(',').slice(0, 2).map((cat, index) => (
                                <span 
                                    key={index}
                                    className={styles.categoryPill}
                                >
                                    {cat.trim()}
                                </span>
                            ))}
                        </div>
                        
                        <a
                            href={book.amazonUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 w-full bg-gradient-to-r from-amber-500 to-amber-400 text-black py-1.5 px-2 rounded-lg hover:from-amber-400 hover:to-amber-300 transition-all duration-300 text-xs font-medium transform hover:scale-105 group"
                            onClick={(e) => {
                                e.preventDefault();
                                onBuyClick();
                            }}
                        >
                            {t('bookshelf.amazonLink')}
                            <FontAwesomeIcon
                                icon={faAmazon}
                                className="w-3 h-3 text-black transition-transform group-hover:scale-110"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
