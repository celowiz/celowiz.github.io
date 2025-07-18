import React from 'react';
import { useTranslation } from 'react-i18next';

const projects = [
  {
    techs: ['python'],
    image: 'https://firstbenefits.org/wp-content/uploads/2017/10/placeholder-1024x1024.png',
    projectUrl: '#',
    codeUrl: '#',
  },
  {
    techs: ['python'],
    image: 'https://firstbenefits.org/wp-content/uploads/2017/10/placeholder-1024x1024.png',
    projectUrl: '#',
    codeUrl: '#',
  },
  {
    techs: ['python'],
    image: 'https://firstbenefits.org/wp-content/uploads/2017/10/placeholder-1024x1024.png',
    projectUrl: '#',
    codeUrl: '#',
  },
  {
    techs: ['python'],
    image: 'https://firstbenefits.org/wp-content/uploads/2017/10/placeholder-1024x1024.png',
    projectUrl: '#',
    codeUrl: '#',
  },
];

const techIcons: Record<string, string> = {
  python: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
  // Adicione mais tecnologias aqui conforme necessário
};

export default function Projects() {
  const { t, i18n } = useTranslation();
  return (
    <section id="projects" className="min-h-screen py-16 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-white">{t('projects.title') || 'Projetos'}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {projects.map((project, idx) => (
            <div key={idx} className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105 flex flex-col overflow-hidden">
              <img src={project.image} alt={t(`projects.${idx + 1}.title`)} className="w-full h-48 object-cover bg-gray-700 transition-transform duration-300 hover:scale-105" />
              <div className="flex-1 p-6 flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-2">{t(`projects.${idx + 1}.title`)}</h3>
                <p className="text-white mb-4">{t(`projects.${idx + 1}.description`)}</p>
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-gray-300 font-medium">
                    {i18n.language === 'pt' ? 'Tecnologias:' : 'Toolbox:'}
                  </span>
                  {project.techs.map((tech) => (
                    <img
                      key={tech}
                      src={techIcons[tech]}
                      alt={tech}
                      title={tech.charAt(0).toUpperCase() + tech.slice(1)}
                      className="w-7 h-7"
                    />
                  ))}
                </div>
                <div className="mt-auto flex gap-4">
                  <a
                    href={project.projectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 hover:scale-105 transition-all duration-300 text-center flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2v-4.5M15 9l-6 6" />
                    </svg>
                    Demo
                  </a>
                  <a
                    href={project.codeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.415-4.042-1.415-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.625-5.475 5.921.43.372.823 1.104.823 2.226 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.373-12-12-12z" />
                    </svg>
                    {i18n.language === 'pt' ? 'Código' : 'Code'}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}