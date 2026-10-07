import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaAmazon } from 'react-icons/fa';
import type { Book } from '../types/Book';
import styles from './BookCard.module.css';

const PLACEHOLDER_COVER = '/covers/placeholder.webp';

interface BookCardProps {
  book: Book;
  onBuyClick: () => void;
}

export function BookCard({ book, onBuyClick }: BookCardProps) {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const coverSrc = book.cover || book.imageUrl || PLACEHOLDER_COVER;
  const primaryCategory = book.category?.split(',')[0]?.trim();

  return (
    <div className={`${styles.bookWrapper} group cursor-pointer`} onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`${styles.book} ${isFlipped ? styles.flipped : ''}`}>
        <div className={`${styles.bookCover} absolute inset-0 overflow-hidden rounded-lg`}>
          <img
            src={coverSrc}
            alt={book.title}
            width={180}
            height={270}
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = PLACEHOLDER_COVER;
            }}
          />
        </div>

        <div className={`${styles.bookBack} absolute inset-0 overflow-hidden rounded-lg`}>
          <div className="flex h-full flex-col items-center justify-between p-2 text-center sm:p-3">
            <div>
              <h3 className="line-clamp-2 text-xs leading-tight font-bold text-paper sm:text-sm">
                {book.title}
              </h3>
              {book.author ? (
                <p className="mt-1 line-clamp-1 text-xs text-paper/60">{book.author}</p>
              ) : null}
            </div>

            {primaryCategory ? (
              <span className={styles.ratingPill}>{primaryCategory}</span>
            ) : null}

            <a
              href={book.amazonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-2 py-1.5 text-xs font-medium text-black transition-all duration-300 group-hover:from-amber-400 hover:to-amber-300"
              onClick={(e) => {
                e.stopPropagation();
                onBuyClick();
              }}
            >
              {t('bookshelf.amazonLink')}
              <FaAmazon className="h-3 w-3 text-black" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
