import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Footer from './components/Footer';
import About from './sections/About';
import Skills from './sections/Skills';
import Projects from './sections/Projects';
import Bookshelf from './sections/Bookshelf';
import './i18n';

function App() {
  return (
    <div className="bg-ink scroll-smooth">
      <Navbar />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Bookshelf />
      <Footer />
    </div>
  );
}

export default App;
