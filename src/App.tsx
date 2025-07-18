import React from 'react';
import Navbar from './components/Navbar';
import Hero from "./components/Hero";
import './i18n';

function App() {
  return (
    <div className="scroll-smooth">
      <Navbar />
      <Hero />
      <section id="about" className="min-h-screen pt-24 bg-gray-100 dark:bg-gray-800">Seção Sobre</section>
      <section id="skills" className="min-h-screen pt-24 bg-white dark:bg-gray-900">Seção Habilidades</section>
      <section id="projects" className="min-h-screen pt-24 bg-gray-100 dark:bg-gray-800">Seção Projetos</section>
    </div>
  );
}

export default App;