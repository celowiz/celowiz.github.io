// src/components/Hero.tsx
import { useTranslation } from "react-i18next";
import { useEffect, useState, ComponentType } from "react";
import { Typewriter } from 'react-simple-typewriter';

export default function Hero() {
  const { t } = useTranslation();
  const [ParticlesBackground, setParticlesBackground] = useState<ComponentType | null>(null);

  useEffect(() => {
    // Lazy load particles após o conteúdo principal carregar
    const loadParticles = async () => {
      try {
        const { Particles } = await import("./ParticlesBackground");
        setParticlesBackground(() => Particles);
      } catch (error) {
        console.warn('Particles failed to load:', error);
      }
    };

    // Delay reduzido para mostrar partículas mais rapidamente
    const timer = setTimeout(loadParticles, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 bg-gradient-to-b from-gray-900 to-black overflow-hidden">
      {/* Partículas de fundo - lazy loaded */}
      {ParticlesBackground && <ParticlesBackground />}

      {/* Conteúdo da Hero acima das partículas */}
      <div className="relative z-10">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 text-white">
          {t("hero.name")}
        </h1>
        <span className="block text-xl sm:text-3xl font-mono text-blue-400 mb-4 min-h-[2.5rem]">
          <TypewriterQuant />
        </span>
        <p className="text-lg sm:text-2xl text-gray-300 mb-8 max-w-xl">
          {t("hero.description")}
        </p>
        <button
          onClick={() => {
            const element = document.getElementById('projects');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-full text-lg font-medium hover:bg-blue-700 focus:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition"
          aria-label="Navegar para a seção de projetos"
        >
          {t("hero.cta")}
        </button>
      </div>
    </section>
  );
}

const roles = [
  "Developer",
  "Analyst",
  "Trader",
  "Data Scientist"
];

export function TypewriterQuant() {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [showQuant, setShowQuant] = useState(true);

  useEffect(() => {
    if (index === roles.length) return;

    // Para Data Scientist, apaga tudo
    if (roles[index] === "Data Scientist") {
      if (!deleting && subIndex === 0) setShowQuant(false);
      if (!deleting && subIndex < roles[index].length) {
        setTimeout(() => setSubIndex(subIndex + 1), 70);
      } else if (deleting && subIndex > 0) {
        setTimeout(() => setSubIndex(subIndex - 1), 50);
      } else if (deleting && subIndex === 0) {
        setTimeout(() => {
          setDeleting(false);
          setIndex((prev) => (prev + 1) % roles.length);
        }, 1200);
      } else if (!deleting && subIndex === roles[index].length) {
        setTimeout(() => setDeleting(true), 1200);
      }
      return;
    }

    // Para os outros, apaga só a segunda palavra
    if (!deleting && subIndex < roles[index].length) {
      setTimeout(() => setSubIndex(subIndex + 1), 70);
    } else if (deleting && subIndex > 0) {
      setTimeout(() => setSubIndex(subIndex - 1), 50);
    } else if (!deleting && subIndex === roles[index].length) {
      setTimeout(() => setDeleting(true), 1200);
    } else if (deleting && subIndex === 0) {
      setTimeout(() => {
        setDeleting(false);
        setIndex((prev) => (prev + 1) % roles.length);
      }, 1200);
    }
  }, [subIndex, deleting, index]);

  useEffect(() => {
    if (roles[index] === "Data Scientist") setShowQuant(false);
    else setShowQuant(true);
    setSubIndex(0);
    setDeleting(false);
  }, [index]);

  return (
    <span className="block text-xl sm:text-3xl font-mono text-blue-400 mb-4 min-h-[2.5rem]">
      {showQuant && "Quant "}
      {roles[index].substring(0, subIndex)}
      <span className="typewriter-cursor">█</span>
    </span>
  );
}
