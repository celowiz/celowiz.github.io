import { useTranslation } from 'react-i18next';
import { AnimatedSection } from '../components/AnimatedSection';


const projects = [
  {
    techs: ['python', 'pandas', 'matplotlib'],
    projectUrl: 'https://celowiz.github.io/quant-notebooks/',
    codeUrl: 'https://github.com/celowiz/quant-notebooks',
  },
  {
    // techs: ['react', 'typescript', 'tailwindcss'],
    techs: ['markdown'],
    projectUrl: 'https://github.com/celowiz/second-brain/blob/main/README.md',
    codeUrl: 'https://github.com/celowiz/second-brain',
  },
  // {
  //   techs: ['python'],
  //   projectUrl: '#',
  //   codeUrl: '#',
  // },
  // {
  //   techs: ['python'],
  //   projectUrl: '#',
  //   codeUrl: '#',
  // },
];

const techIcons: Record<string, string> = {
  python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  pandas: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg',
  matplotlib: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/matplotlib/matplotlib-original.svg',
  react: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  typescript: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
  tailwindcss: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg',
  markdown: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/markdown/markdown-original.svg',

};

export default function Projects() {
  const { t, i18n } = useTranslation();
  return (
    <section id="projects" className="min-h-screen py-20 bg-gradient-to-b from-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-white">{t('projects.title') || 'Projetos'}</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {i18n.language === 'pt'
              ? 'Uma seleção dos meus projetos mais relevantes, demonstrando minha expertise em desenvolvimento e análise de dados.'
              : 'A selection of my most relevant projects, showcasing my expertise in development and data analysis.'
            }
          </p>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {projects.map((project, idx) => (
            <AnimatedSection
              key={idx}
              animation="fadeInUp"
              delay={idx * 300}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50 hover:border-blue-400/60 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex flex-col overflow-hidden h-full"
            >
              <div className="p-8 flex flex-col flex-1">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
                    {t(`projects.${idx + 1}.title`)}
                  </h3>
                  <p className="text-gray-300 text-base leading-relaxed">
                    {t(`projects.${idx + 1}.description`)}
                  </p>
                </div>

                <div className="flex-1 flex flex-col">
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-blue-400 font-medium text-sm">
                        {i18n.language === 'pt' ? 'Tecnologias' : 'Technologies'}
                      </span>
                      <div className="flex-1 h-px bg-gray-600"></div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {project.techs.map((tech) => (
                        <div
                          key={tech}
                          className="flex items-center gap-2 bg-gray-700/50 px-3 py-2 rounded-lg hover:bg-gray-600/50 transition-colors"
                          title={tech.charAt(0).toUpperCase() + tech.slice(1)}
                        >
                          <img
                            src={techIcons[tech]}
                            alt={tech}
                            className="w-5 h-5"
                          />
                          <span className="text-gray-300 text-xs font-medium capitalize">
                            {tech}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-auto flex gap-4">
                    <a
                      href={project.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 text-center flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-4.5M15 9l-6 6" />
                      </svg>
                      {i18n.language === 'pt' ? 'Ver Projeto' : 'View Project'}
                    </a>
                    <a
                      href={project.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-6 py-4 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.415-4.042-1.415-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.625-5.475 5.921.43.372.823 1.104.823 2.226 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.373-12-12-12z" />
                      </svg>
                      {i18n.language === 'pt' ? 'Código' : 'Code'}
                    </a>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}