import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaAmazon } from 'react-icons/fa';
import { Tablet } from 'lucide-react';
import { trackBookClick } from '../lib/analytics.mjs';
import { tagsOf, themeOf } from '../lib/bookTaxonomy';
import type { Book } from '../types/Book';
import styles from './BookCard.module.css';

const PLACEHOLDER_COVER = '/covers/placeholder.webp';

interface BookCardProps {
  book: Book;
}

export function BookCard({ book }: BookCardProps) {
  const { t } = useTranslation();
  const [isFlipped, setIsFlipped] = useState(false);
  const coverSrc = book.cover || book.imageUrl || PLACEHOLDER_COVER;
  const theme = themeOf(book);
  const tags = tagsOf(book);

  return (
    <div className={`${styles.bookWrapper} group cursor-pointer`} onClick={() => setIsFlipped(!isFlipped)}>
      <div className={`${styles.book} ${isFlipped ? styles.flipped : ''}`}>
        <div className={`${styles.bookCover} rounded-t-md`}>
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

        <div className={`${styles.bookBack} rounded-t-md`}>
          <div className="flex h-full flex-col items-center justify-between p-2 text-center sm:p-3">
            <div>
              <h3 className="line-clamp-2 text-xs leading-tight font-bold text-paper sm:text-sm">
                {book.title}
              </h3>
              {book.author ? (
                <p className="mt-1 line-clamp-1 text-xs text-paper/60">{book.author}</p>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-1">
              <span className={styles.ratingPill}>{t(`bookshelf.themes.${theme}`, { defaultValue: theme })}</span>
              {tags.length > 0 ? (
                <p className="line-clamp-2 text-[10px] leading-tight text-paper/50">
                  {tags.map((tag) => t(`bookshelf.tags.${tag}`, { defaultValue: tag })).join(' · ')}
                </p>
              ) : null}
            </div>

            <div className="flex w-full flex-col items-center gap-1">
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-amber-400 px-2 py-1.5 text-xs font-medium text-black transition-all duration-300 group-hover:from-amber-400 hover:to-amber-300"
                onClick={(e) => {
                  e.stopPropagation();
                  trackBookClick({ ...book, format: 'physical' });
                }}
              >
                {t('bookshelf.amazonLink')}
                <FaAmazon className="h-3 w-3 text-black" />
              </a>

              {book.kindleUrl ? (
                <a
                  href={book.kindleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('bookshelf.kindleAria', { title: book.title })}
                  className="flex w-full items-center justify-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[11px] text-paper/70 transition-colors hover:border-teal/60 hover:text-teal focus-visible:border-teal focus-visible:text-teal focus-visible:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    trackBookClick({ ...book, format: 'kindle' });
                  }}
                >
                  <Tablet className="h-3 w-3" aria-hidden="true" />
                  {t('bookshelf.kindle')}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
