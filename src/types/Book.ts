export interface Book {
    id: string;
    title: string;
    amazonUrl: string;
    /** Link da edição Kindle (com tag de afiliado), quando existe. */
    kindleUrl?: string;
    /** Tema principal (um dos 7 de bookTaxonomy). Mantido por compatibilidade. */
    category: string;
    categories?: string[];
    theme?: string;
    tags?: string[];
    language?: 'PT' | 'EN';
    author?: string;
    description?: string;
    imageUrl?: string;
    cover?: string;
    isbn?: string;
    asin?: string;
}
