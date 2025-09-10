export interface Book {
    id: string;
    title: string;
    amazonUrl: string;
    category: string;
    author?: string;
    description?: string;
    imageUrl?: string;
    pages?: string;
    publisher?: string;
    publishDate?: string;
    subjects?: string[];
    isbn?: string;
    affiliateLink?: string;
}
