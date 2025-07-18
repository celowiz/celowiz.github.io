// src/components/Hero.tsx
import { useTranslation } from "react-i18next";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { useEffect, useMemo, useState } from "react";
import { loadSlim } from "@tsparticles/slim"; // ou loadFull se quiser todos os recursos

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
          resize: true,
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
          direction: "none",
          outModes: { default: "out" },
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
