export interface Book {
    id: string;
    title: string;
    amazonUrl: string;
    category: string;
    categories?: string[];
    author?: string;
    description?: string;
    imageUrl?: string;
    cover?: string;
    isbn?: string;
    asin?: string;
}
