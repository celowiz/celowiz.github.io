import React from 'react';
import Navbar from './components/Navbar';
import Hero from "./components/Hero";
import About from "./sections/About";
import Skills from "./sections/Skills";
import Projects from "./sections/Projects";
import SecondBrain from "./sections/SecondBrain";
import Footer from "./components/Footer";
import './i18n';

function App() {
  return (
    <div className="scroll-smooth">
      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <SecondBrain />
      <Footer />
    </div>
  );
}

export default App;