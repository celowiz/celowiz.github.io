// src/components/Hero.tsx
import { useTranslation } from "react-i18next";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useMemo, useState } from "react";
import { loadSlim } from "@tsparticles/slim"; // ou loadFull se quiser todos os recursos
import { Typewriter } from 'react-simple-typewriter';

export default function Hero() {
  const { t } = useTranslation();
  const [init, setInit] = useState(false);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const options = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          resize: { enable: true },
        },
        modes: {
          repulse: { distance: 120, duration: 0.4 },
        },
      },
      particles: {
        number: { value: 200, density: { enable: true, area: 800 } },
        color: { value: "#ffffff" },
        links: {
          enable: true,
          color: "#60a5fa",
          distance: 150,
          opacity: 0.4,
          width: 1.2,
        },
        move: {
          enable: true,
          speed: 1.2,
          outModes: { default: "out" as const },
        },
        size: { value: 3 },
        opacity: { value: 0.7 },
      },
    }),
    []
  );

  return (
    <section id="hero" className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black overflow-hidden">
      {/* Partículas de fundo */}
      {init && (
        <Particles
          id="tsparticles"
          className="absolute inset-0 z-0"
          options={options}
        />
      )}
      {/* Conteúdo da Hero acima das partículas */}
      <div className="relative z-10">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 text-gray-900 dark:text-white">
          {t("hero.name")}
        </h1>
        <span className="block text-xl sm:text-3xl font-mono text-blue-500 mb-4 min-h-[2.5rem]">
          <TypewriterQuant />
        </span>
        <p className="text-lg sm:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-xl">
          {t("hero.description")}
        </p>
        <button
          onClick={() => {
            const element = document.getElementById('projects');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="px-6 py-3 bg-blue-600 text-white rounded-full text-lg font-medium hover:bg-blue-700 transition"
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
    <span className="block text-xl sm:text-3xl font-mono text-blue-500 mb-4 min-h-[2.5rem]">
      {showQuant && "Quant "}
      {roles[index].substring(0, subIndex)}
      <span className="typewriter-cursor">█</span>
    </span>
  );
}
