import React from 'react';
import Navbar from './components/Navbar';
import Hero from "./components/Hero";
import Skills from "./sections/Skills";
import Projects from "./sections/Projects";
import Footer from "./components/Footer";
import './i18n';

function App() {
  return (
    <div className="scroll-smooth">
      <Navbar />
      <Hero />
      <section id="about" className="min-h-screen pt-24 bg-gray-100 dark:bg-gray-800">Seção Sobre</section>
      <Skills />
      <Projects />
      <Footer />
    </div>
  );
}

export default App;