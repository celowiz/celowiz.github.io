import { useEffect, useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const PROMPT = 'Quant Developer · Analyst · Trader';

function TerminalPrompt() {
  const reduced = usePrefersReducedMotion();
  const [text, setText] = useState(reduced ? PROMPT : '');
  const done = text === PROMPT;

  useEffect(() => {
    if (reduced) {
      setText(PROMPT);
      return;
    }

    let index = 0;
    const id = window.setInterval(() => {
      index += 1;
      setText(PROMPT.slice(0, index));
      if (index >= PROMPT.length) window.clearInterval(id);
    }, 28);

    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <p className="mt-6 font-mono text-sm tracking-wide text-teal sm:text-base">
      <span className="select-none text-paper/35">$ </span>
      {text}
      {reduced ? null : (
        <span
          className={done ? 'terminal-caret is-done' : 'terminal-caret'}
          aria-hidden="true"
        >
          █
        </span>
      )}
    </p>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const [ParticlesBackground, setParticlesBackground] = useState<ComponentType | null>(null);

  useEffect(() => {
    const loadParticles = async () => {
      try {
        const { Particles } = await import('./ParticlesBackground');
        setParticlesBackground(() => Particles);
      } catch (error) {
        console.warn('Particles failed to load:', error);
      }
    };

    const timer = setTimeout(loadParticles, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink px-6 text-center"
    >
      {ParticlesBackground ? <ParticlesBackground /> : null}

      <div className="hero-copy relative z-10 mx-auto max-w-3xl">
        <h1 className="font-serif text-5xl leading-tight tracking-tight text-paper sm:text-7xl">
          {t('hero.name')}
        </h1>
        <TerminalPrompt />
        <p className="mx-auto mt-8 max-w-xl text-lg text-paper/70 sm:text-xl">
          {t('hero.description')}
        </p>
        <button
          type="button"
          onClick={() => {
            const element = document.getElementById('projects');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="mt-10 border-b border-teal/50 pb-0.5 text-base text-teal transition-colors hover:border-teal hover:text-teal-dim focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
          aria-label={t('hero.ctaAria')}
        >
          {t('hero.cta')}
        </button>
      </div>
    </section>
  );
}
