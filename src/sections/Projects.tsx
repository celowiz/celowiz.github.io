import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../components/AnimatedSection';
import { useAnalytics } from '../hooks/useAnalytics';
import { BrainCircuit, ChartColumnBig, CloudSun, FlaskConical, GitCompareArrows, Newspaper, NotebookPen, Orbit, Radar, Sigma, type LucideIcon } from 'lucide-react';
import { SiGithub } from 'react-icons/si';

const projects: { icon: LucideIcon; techs: string[]; projectUrl: string; codeUrl: string }[] = [
  {
    icon: NotebookPen,
    techs: ['python', 'pandas', 'matplotlib'],
    projectUrl: 'https://celowiz.github.io/quant-notebooks/',
    codeUrl: 'https://github.com/celowiz/quant-notebooks',
  },
  {
    icon: BrainCircuit,
    techs: ['markdown'],
    projectUrl: '/second-brain/',
    codeUrl: 'https://github.com/celowiz/second-brain',
  },
  {
    icon: Radar,
    techs: ['react', 'vite', 'python', 'yfinance', 'githubactions', 'githubpages'],
    projectUrl: 'https://celowiz.github.io/monitor-b3/',
    codeUrl: 'https://github.com/celowiz/monitor-b3',
  },
  {
    icon: Orbit,
    techs: ['javascript', 'python', 'pandas', 'yfinance', 'githubactions', 'githubpages'],
    projectUrl: 'https://celowiz.github.io/rrg/',
    codeUrl: 'https://github.com/celowiz/rrg',
  },
  {
    icon: CloudSun,
    techs: ['javascript', 'python', 'pandas', 'yfinance', 'githubactions', 'githubpages'],
    projectUrl: 'https://celowiz.github.io/hmm-regimes/',
    codeUrl: 'https://github.com/celowiz/hmm-regimes',
  },
  {
    icon: GitCompareArrows,
    techs: ['javascript', 'python', 'pandas', 'numpy', 'statsmodels', 'yfinance', 'githubactions', 'githubpages'],
    projectUrl: 'https://celowiz.github.io/pairs-trading/',
    codeUrl: 'https://github.com/celowiz/pairs-trading',
  },
  {
    icon: ChartColumnBig,
    techs: ['javascript', 'python', 'pandas', 'yfinance', 'githubactions', 'githubpages'],
    projectUrl: 'https://celowiz.github.io/setores/',
    codeUrl: 'https://github.com/celowiz/setores',
  },
  {
    icon: FlaskConical,
    techs: ['vite', 'javascript', 'githubpages'],
    projectUrl: '/lab/',
    codeUrl: 'https://github.com/celowiz/celowiz.github.io/tree/main/src/lab',
  },
  {
    icon: Newspaper,
    techs: ['javascript', 'python', 'githubactions', 'githubpages'],
    projectUrl: '/mercado-hoje/',
    codeUrl: 'https://github.com/celowiz/celowiz.github.io/tree/main/src/mercado-hoje',
  },
];

const techIcons: Record<string, string> = {
  react: '/icons/react/react-original.svg',
  vite: '/icons/vite/vite-original.svg',
  python: '/icons/python/python-original.svg',
  pandas: '/icons/pandas/pandas-original.svg',
  matplotlib: '/icons/matplotlib/matplotlib-original.svg',
  markdown: '/icons/markdown/markdown-original.svg',
  javascript: '/icons/javascript/javascript-original.svg',
  yfinance: '/icons/yfinance/yfinance-original.svg',
  githubactions: '/icons/githubactions/githubactions-original.svg',
  githubpages: '/icons/github/github-original.svg',
  numpy: '/icons/numpy/numpy-original.svg',
};

// Techs sem ícone no devicon local: ícone Lucide genérico.
const techLucide: Record<string, LucideIcon> = { statsmodels: Sigma };

const techLabels: Record<string, string> = {
  react: 'React Flow',
  vite: 'Vite',
  python: 'Python',
  pandas: 'Pandas',
  matplotlib: 'Matplotlib',
  markdown: 'Markdown',
  javascript: 'JavaScript',
  yfinance: 'yfinance',
  githubactions: 'GitHub Actions',
  githubpages: 'GitHub Pages',
  numpy: 'NumPy',
  statsmodels: 'statsmodels',
};

export default function Projects() {
  const { t } = useTranslation();
  const { trackProjectClick } = useAnalytics();
  const slug = (url: string) => url.split('/').filter(Boolean).pop() ?? url;
  return (
    <section id="projects" className="scroll-mt-28 bg-ink py-24 sm:py-28">
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
                <h3 className="flex items-center gap-2.5 text-xl font-medium text-paper">
                  <project.icon aria-hidden="true" className="h-5 w-5 shrink-0 text-teal/80" strokeWidth={1.75} />
                  {t(`projects.${idx + 1}.title`)}
                </h3>
                <div className="flex gap-5 text-sm">
                  <a
                    href={project.projectUrl}
                    onClick={() => trackProjectClick(slug(project.codeUrl), 'demo')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal transition-colors hover:text-teal-dim"
                  >
                    {t('projects.viewProject')}
                  </a>
                  <a
                    href={project.codeUrl}
                    onClick={() => trackProjectClick(slug(project.codeUrl), 'code')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-paper/60 transition-colors hover:text-paper"
                  >
                    <SiGithub aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                    {t('projects.code')}
                  </a>
                </div>
              </div>
              <p className="mt-3 text-base leading-relaxed text-paper/65">
                {t(`projects.${idx + 1}.description`)}
              </p>
              <ul className="mt-5 flex flex-wrap gap-3">
                {project.techs.map((tech) => { const TechIcon = techLucide[tech]; return (
                  <li key={tech} className="flex items-center gap-2 text-xs text-paper/70">
                    {TechIcon ? (
                      <TechIcon aria-hidden="true" className="h-4 w-4 text-teal/80" strokeWidth={2} />
                    ) : (
                      <img
                        src={techIcons[tech]}
                        alt=""
                        width={16}
                        height={16}
                        className={`h-4 w-4${tech === 'githubpages' ? ' invert' : ''}`}
                      />
                    )}
                    <span>{techLabels[tech] ?? tech}</span>
                  </li>
                ); })}
              </ul>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
