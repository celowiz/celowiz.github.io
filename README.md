# 🚀 Portfolio de Projetos – Marcelo Wizenberg

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Analytics](https://img.shields.io/badge/Google_Analytics-E37400?style=for-the-badge&logo=google%20analytics&logoColor=white)](https://analytics.google.com/)

> Um portfólio moderno, responsivo e bilíngue desenvolvido com as melhores práticas do mercado.

## 🇧🇷 Sobre o Projeto

Este é meu espaço pessoal para compartilhar projetos, aprendizados e experiências no universo de desenvolvimento web, ciência de dados e tecnologia aplicada ao mercado financeiro.

### 🎯 Objetivos
- Criar um portfólio moderno e profissional
- Demonstrar habilidades técnicas em programação e análise quantitativa
- Compartilhar experiências e aprendizados
- Servir como inspiração para outros desenvolvedores

### ✨ Destaques
- **Interface Moderna**: Design responsivo com animações suaves
- **Bilíngue**: Suporte completo para português e inglês
- **Performance Otimizada**: Lazy loading, code splitting e otimizações avançadas
- **Acessibilidade**: Conformidade com WCAG e melhores práticas de UX
- **SEO Otimizado**: Meta tags, Open Graph e dados estruturados
- **Analytics Integrado**: Google Analytics com eventos customizados

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
- **Bilingual**: Full support for Portuguese and English
- **Optimized Performance**: Lazy loading, code splitting and advanced optimizations
- **Accessibility**: WCAG compliance and UX best practices
- **SEO Optimized**: Meta tags, Open Graph and structured data
- **Integrated Analytics**: Google Analytics with custom events

---

## 🚀 Quick Start

### Pré-requisitos / Prerequisites
- Node.js 18+
- npm ou yarn

### Instalação / Installation

```bash
# Clone o repositório / Clone the repository
git clone https://github.com/celowiz/cv-site.git
cd cv-site

# Instale as dependências / Install dependencies
npm install
```

### Desenvolvimento / Development

```bash
# Rode o projeto localmente / Run locally
npm run dev
```

Acesse em http://localhost:5173

### Build para Produção / Production Build

```bash
# Build otimizado / Optimized build
npm run build

# Preview do build / Preview build
npm run preview
```

---

## 🏗️ Arquitetura do Projeto / Project Architecture

```
src/
├── components/          # Componentes reutilizáveis
│   ├── AnimatedSection.tsx
│   ├── BookCard.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── LanguageToggle.tsx
│   ├── Navbar.tsx
│   └── ParticlesBackground.tsx
├── sections/           # Seções principais do site
│   ├── About.tsx
│   ├── Bookshelf.tsx
│   ├── Projects.tsx
│   └── Skills.tsx
├── hooks/             # Custom hooks
│   ├── useAnalytics.ts
│   └── useIntersectionObserver.ts
├── contexts/          # Context providers (se houver)
├── config/            # Configurações
│   └── secrets.ts
├── i18n/              # Internacionalização
│   ├── en.json
│   ├── pt.json
│   └── index.ts
├── types/             # TypeScript type definitions
│   ├── Book.ts
│   └── css-modules.d.ts
├── App.tsx            # Componente principal
├── main.tsx           # Ponto de entrada
└── index.css          # Estilos globais
```

---

## 🛠️ Tecnologias & Ferramentas / Technologies & Tools

### Core Technologies
- **React 18** - Framework UI com hooks modernos
- **TypeScript** - Tipagem estática para maior robustez
- **Vite** - Build tool ultrarrápido com HMR

### Styling & UI
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - Processamento avançado de CSS
- **Lucide React** - Ícones modernos e consistentes
- **Font Awesome** - Ícones adicionais

### Performance & Optimization
- **React.lazy()** - Code splitting automático
- **Intersection Observer** - Animações baseadas em viewport
- **Lazy Loading** - Carregamento sob demanda

### Analytics & SEO
- **Google Analytics 4** - Analytics avançado com eventos customizados
- **React Helmet** - Gerenciamento de meta tags
- **Open Graph** - Compartilhamento otimizado

### Development Tools
- **ESLint** - Linting e formatação de código
- **Prettier** - Formatação automática
- **TypeScript Compiler** - Verificação de tipos
- **GitHub Actions** - CI/CD automatizado

### Libraries & Integrations
- **i18next** - Internacionalização completa
- **PapaParse** - Processamento de CSV (livros)
- **tsParticles** - Animações de fundo
- **react-simple-typewriter** - Efeito máquina de escrever

---

## 📊 Funcionalidades / Features

### 🎨 Interface & UX
- Design responsivo (mobile-first)
- Animações suaves com CSS transitions
- Dark theme otimizado
- Loading states e skeletons
- Smooth scrolling nativo

### 🌍 Internacionalização
- Suporte para português e inglês
- Traduções completas de todo conteúdo
- Detecção automática de idioma do navegador
- Persistência da preferência do usuário

### 📈 Analytics & Performance
- Rastreamento de seções visualizadas
- Eventos de interação (projetos, livros, links)
- Métricas de performance (LCP, FID, CLS)
- Monitoramento de engajamento do usuário

### 📚 Seções do Site
- **Hero**: Introdução com typewriter effect
- **Sobre**: Minha trajetória profissional
- **Habilidades**: Tecnologias e ferramentas
- **Projetos**: Trabalhos em destaque
- **Estante**: Livros recomendados
- **Footer**: Links e informações de contato

---

## 🔧 Scripts Disponíveis / Available Scripts

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build para produção
npm run preview      # Preview do build
npm run lint         # Executa ESLint
npm run type-check   # Verifica tipos TypeScript
```

---

## 🌐 Deploy & CDN

### GitHub Pages
O projeto é automaticamente deployado para GitHub Pages através de GitHub Actions.

### Otimizações de Produção
- Minificação de código
- Compressão Gzip/Brotli
- Otimização de imagens
- Cache inteligente de assets
- Service Worker para PWA

---

## 🤝 Contribuição / Contributing

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença / License

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## ✨ Autor / Author

**Marcelo Wizenberg**  
*Desenvolvedor Full-Stack & Analista Quantitativo*

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/marcelowizenberg/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/celowiz)
[![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:marcelo.wizen@gmail.com)

---

## 🙏 Agradecimentos / Acknowledgments

- **React Community** - Pela incrível documentação e ecossistema
- **Tailwind CSS** - Por tornar o CSS produtivo novamente
- **Vite** - Por revolucionar o desenvolvimento frontend
- **Open Source Community** - Por todas as bibliotecas e ferramentas

---

⭐ **Sinta-se à vontade para explorar, contribuir ou se inspirar!**  
⭐ **Feel free to explore, contribute, or get inspired!**

---

*Última atualização: Janeiro 2025 / Last updated: January 2025*
