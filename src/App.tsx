import React, { Suspense } from 'react';
import Navbar from './components/Navbar';
import Hero from "./components/Hero";
import Footer from "./components/Footer";
import './i18n';

// Lazy loading dos componentes pesados
const About = React.lazy(() => import('./sections/About'));
const Skills = React.lazy(() => import('./sections/Skills'));
const Projects = React.lazy(() => import('./sections/Projects'));
const Bookshelf = React.lazy(() => import('./sections/Bookshelf'));

// Componente de loading otimizado
const SectionLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

function App() {
  return (
    <div className="scroll-smooth">
      <Navbar />
      <Hero />

      {/* Lazy loaded sections com Suspense */}
      <Suspense fallback={<SectionLoader />}>
        <About />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <Skills />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <Projects />
      </Suspense>

      <Suspense fallback={<SectionLoader />}>
        <Bookshelf />
      </Suspense>

      <Footer />
    </div>
  );
}

export default App;