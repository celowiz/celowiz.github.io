import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../components/AnimatedSection';

const projects = [
  {
    techs: ['python', 'pandas', 'matplotlib'],
    projectUrl: 'https://celowiz.github.io/quant-notebooks/',
    codeUrl: 'https://github.com/celowiz/quant-notebooks',
  },
  {
    techs: ['markdown'],
    projectUrl: 'https://github.com/celowiz/second-brain/blob/main/README.md',
    codeUrl: 'https://github.com/celowiz/second-brain',
  },
];

const techIcons: Record<string, string> = {
  python: '/icons/python/python-original.svg',
  pandas: '/icons/pandas/pandas-original.svg',
  matplotlib: '/icons/matplotlib/matplotlib-original.svg',
  markdown: '/icons/markdown/markdown-original.svg',
};

export default function Projects() {
  const { t } = useTranslation();
  return (
    <section id="projects" className="scroll-mt-24 bg-ink py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t('projects.title')}</h2>
        <p className="mt-6 max-w-2xl text-lg text-paper/70">{t('projects.intro')}</p>
        <div className="mt-12">
          {projects.map((project, idx) => (
            <AnimatedSection
              key={project.codeUrl}
              delay={idx * 60}
              className="group border-b border-white/10 py-8 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="text-xl font-medium text-paper">
                  {t(`projects.${idx + 1}.title`)}
                </h3>
                <div className="flex gap-5 text-sm">
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal transition-colors hover:text-teal-dim"
                  >
                    {t('projects.viewProject')}
                  </a>
                  <a
                    href={project.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-paper/60 transition-colors hover:text-paper"
                  >
                    {t('projects.code')}
                  </a>
                </div>
              </div>
              <p className="mt-3 text-base leading-relaxed text-paper/65">
                {t(`projects.${idx + 1}.description`)}
              </p>
              <ul className="mt-5 flex flex-wrap gap-3">
                {project.techs.map((tech) => (
                  <li key={tech} className="flex items-center gap-2 text-xs text-paper/70">
                    <img
                      src={techIcons[tech]}
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4"
                    />
                    <span className="capitalize">{tech}</span>
                  </li>
                ))}
              </ul>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
