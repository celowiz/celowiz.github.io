# Portfolio – Marcelo Wizenberg

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Analytics](https://img.shields.io/badge/Google_Analytics-E37400?style=for-the-badge&logo=google%20analytics&logoColor=white)](https://analytics.google.com/)

> Um portfólio moderno, responsivo e bilíngue (pt/en), publicado no GitHub Pages.

## 🇧🇷 Sobre o Projeto

Este é meu espaço pessoal para compartilhar projetos, aprendizados e experiências no universo de desenvolvimento web, ciência de dados e tecnologia aplicada ao mercado financeiro.

### 🎯 Objetivos
- Criar um portfólio moderno e profissional
- Demonstrar habilidades técnicas em programação e análise quantitativa
- Compartilhar experiências e aprendizados
- Servir como inspiração para outros desenvolvedores

### ✨ Destaques
- **Interface Moderna**: Design responsivo com animações suaves
- **Bilíngue**: Português (padrão) e inglês, com persistência em `localStorage`
- **Performance Otimizada**: Lazy loading, code splitting e fontes self-hosted
- **Acessibilidade**: Contraste e `aria-label` alinhados ao texto visível
- **SEO Otimizado**: Meta tags, Open Graph, `robots.txt` e `sitemap.xml`
- **Analytics Integrado**: Google Analytics 4 carregado após o `load` da página
- **PWA / offline**: Service Worker com HTML network-first e cache versionado

---

## 🇺🇸 About this Project

This is my personal space to share projects, learning experiences, and insights in web development, data science, and technology applied to financial markets.

### 🎯 Goals
- Build a modern and professional portfolio
- Showcase technical skills in programming and quantitative analysis
- Share experiences and learnings
- Inspire other developers

### ✨ Highlights
- **Modern Interface**: Responsive design with smooth animations
- **Bilingual**: Portuguese (default) and English, persisted in `localStorage`
- **Optimized Performance**: Lazy loading, code splitting, and self-hosted fonts
- **Accessibility**: Contrast and `aria-label`s that include visible text
- **SEO Optimized**: Meta tags, Open Graph, `robots.txt`, and `sitemap.xml`
- **Integrated Analytics**: Google Analytics 4 deferred until after `window.load`
- **PWA / offline**: Service Worker with network-first HTML and versioned caches

---

## 🚀 Quick Start

### Pré-requisitos / Prerequisites
- Node.js 18+
- npm

### Instalação / Installation

```bash
git clone https://github.com/celowiz/celowiz.github.io.git
cd celowiz.github.io
npm ci
```

### Desenvolvimento / Development

```bash
npm run sync-books   # gera public/books.json e capas WebP
npm run dev
```

Acesse em http://localhost:5173

### Build para Produção / Production Build

```bash
npm run build
npm run preview
```

`npm run build` também gera ícones PNG, a imagem Open Graph e copia a fonte Inter.

---

## 📚 Estante de livros (second-brain)

A lista de livros **não** fica hardcoded no site. No deploy (e num cron diário) o workflow:

1. Baixa `books.csv` do repositório público [celowiz/second-brain](https://github.com/celowiz/second-brain/blob/main/books.csv)
2. Mapeia colunas (`isbn` → `id` sem hífens; `amazon` + tag de afiliado `celowiz-20`; `categories` separadas por `;`)
3. Busca capas na Open Library (lote) e, se faltar, na Amazon
4. Converte para WebP 180×270 em `public/covers/<isbn>.webp`
5. Gera `public/books.json` para o app carregar em uma única requisição

Scripts:

```bash
npm run sync-books
npm test            # testes do mapeamento CSV / afiliado
```

Não há PAT nem `repository_dispatch` para o second-brain: o CSV é público.

---

## 🎨 Ícones Devicon

Os ícones de Skills/Projects são SVGs **self-hosted** em `public/icons/`.

Fonte: [devicon.dev](https://devicon.dev/) via

`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<name>/<name>-original.svg`

Para adicionar um ícone novo:

```bash
# exemplo: typescript
mkdir -p public/icons/typescript
curl -fsSL "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" \
  -o public/icons/typescript/typescript-original.svg
```

Ou rode `npm run fetch-devicons` (baixa o conjunto atual usado no site).

---

## 🏗️ Arquitetura do Projeto / Project Architecture

```
src/
├── components/
├── sections/
├── hooks/
├── i18n/
├── types/
├── App.tsx
├── main.tsx
└── index.css
scripts/
├── sync-books.mjs              # CSV → books.json + capas
├── generate-site-assets.mjs    # OG 1200×630, ícones PNG, fonte
├── fetch-devicons.mjs
└── lib/books.mjs
public/
├── books.json
├── covers/
├── icons/                      # Devicon SVGs
├── fonts/                      # Inter variable (latin)
├── robots.txt
├── sitemap.xml
└── sw.js
```

---

## 🛠️ Tecnologias

- **React 19** + **TypeScript** + **Vite 7** + **Tailwind CSS v4**
- **i18next** – pt/en
- **@tsparticles/slim** – partículas no Hero (lazy, sem preload no entry)
- **@fontsource-variable/inter** – fonte self-hosted (subset latin)
- **sharp** (dev) – capas WebP e assets de SEO
- **GitHub Pages + Actions** – único custo: zero (sem Vercel/Railway/Workers)

---

## 🔧 Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm test
npm run sync-books
npm run generate-assets
```

---

## 🌐 Deploy

O site é publicado em [https://celowiz.github.io/](https://celowiz.github.io/) via GitHub Pages.

- Push em `main` → build + deploy
- Cron diário (`0 6 * * *`) + `workflow_dispatch` → atualiza a estante e republica
- PRs rodam CI (`lint` + `test` + `sync-books` + `build`)

---

## 📄 Licença / License

Este projeto está sob a licença MIT.

---

## ✨ Autor / Author

**Marcelo Wizenberg**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/marcelowizenberg/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/celowiz)
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/marcelo_wz)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:marcelo.wizen@gmail.com)
