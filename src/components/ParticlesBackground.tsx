// src/components/ParticlesBackground.tsx
import { useEffect, useMemo, useState } from "react";

export function Particles() {
  const [ParticlesComponent, setParticlesComponent] = useState<React.ComponentType<any> | null>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    const loadParticles = async () => {
      try {
        const { default: Particles, initParticlesEngine } = await import("@tsparticles/react");
        const { loadSlim } = await import("@tsparticles/slim");

        await initParticlesEngine(async (engine) => {
          await loadSlim(engine);
        });

        setParticlesComponent(() => Particles);
        setInit(true);
      } catch (error) {
        console.warn('Particles failed to load:', error);
      }
    };

    loadParticles();
  }, []);

  const options = useMemo(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: true, mode: "repulse" },
          onClick: { enable: true, mode: "push" },
          resize: { enable: true },
        },
        modes: {
          repulse: { distance: 120, duration: 0.4 },
          push: { quantity: 4 },
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
          speed: 2,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" as const },
        },
        size: { value: { min: 1, max: 4 } },
        opacity: { value: { min: 0.3, max: 0.8 } },
        shape: { type: "circle" },
      },
      detectRetina: true,
    }),
    []
  );

  if (!ParticlesComponent || !init) return null;

  return (
    <ParticlesComponent
      id="tsparticles"
      className="absolute inset-0 z-0"
      options={options}
    />
  );
}
