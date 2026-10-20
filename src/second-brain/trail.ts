// Trilha "Comece por aqui": aponta para itens que existem no README (por URL), para uma
// subcategoria ou para livros da estante (por ISBN). Itens que saírem da lista somem da trilha.
export type TrailStep =
  | { key: string; urls: string[] }
  | { key: string; sub: string }
  | { key: string; isbns: string[] };

export const TRAIL: TrailStep[] = [
  {
    key: 'markets',
    urls: [
      'https://www.coursera.org/learn/financial-markets-global',
      'https://edu.b3.com.br/w/contrato-futuro-de-di',
    ],
  },
  {
    key: 'python',
    urls: ['https://jakevdp.github.io/PythonDataScienceHandbook/', 'https://quantecon.org/'],
  },
  {
    key: 'backtest',
    urls: [
      'https://edu.b3.com.br/w/introducao-a-estrategias-de-momentum-usando-python',
      'https://letianzj.github.io/quanttrading-backtest.html',
    ],
  },
  { key: 'pitfalls', sub: 'quant-research/research-infrastructure-backtesting-pitfalls' },
  { key: 'books', isbns: ['9781119800064', '9781119931898'] },
];
