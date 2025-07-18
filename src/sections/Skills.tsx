import React from 'react';
import { useTranslation } from 'react-i18next';
import { Code, Globe, BrainCircuit, Database, AppWindow } from 'lucide-react';

const skills = [
  {
    category: 'languages',
    icon: 'code-xml',
    items: [
      {
        name: 'Python',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
      },
      {
        name: 'R',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/r/r-original.svg',
      },
      {
        name: 'JavaScript',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      },
      {
        name: 'SQL',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
      },
    ],
  },
  {
    category: 'frameworks',
    icon: 'globe',
    items: [
      {
        name: 'Next.js',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg',
      },
      {
        name: 'Vite',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vite/vite-original.svg',
      },
      {
        name: 'React',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
      },
      {
        name: 'Node.js',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
      },
      {
        name: 'FastAPI',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg',
      },
      {
        name: 'Flask',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg',
      },
      {
        name: 'HTML5',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg',
      },
      {
        name: 'CSS3',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg',
      },
    ],
  },
  {
    category: 'pythonLibs',
    icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    items: [
      {
        name: 'Pandas',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg',
      },
      {
        name: 'NumPy',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg',
      },
      {
        name: 'Scikit-learn',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scikitlearn/scikitlearn-original.svg',
      },
      {
        name: 'Matplotlib',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/matplotlib/matplotlib-original.svg',
      },
      {
        name: 'Plotly',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/plotly/plotly-original.svg',
      },
    ],
  },
  {
    category: 'ml',
    icon: 'brain-circuit',
    items: [
      {
        name: 'TensorFlow',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg',
      },
      {
        name: 'Spyder',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/spyder/spyder-original.svg',
      },
    ],
  },
  {
    category: 'databases',
    icon: 'database',
    items: [
      {
        name: 'PostgreSQL',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
      },
      {
        name: 'MySQL',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
      },
      {
        name: 'MongoDB',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg',
      },
    ],
  },
  {
    category: 'others',
    icon: 'app-window',
    items: [
      {
        name: 'Git / GitHub',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
      },
      {
        name: 'Streamlit',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/streamlit/streamlit-original.svg',
      },
      {
        name: 'Jupyter Notebooks',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg',
      },
      {
        name: 'VSCode',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg',
      },
    ],
  },
];

export default function Skills() {
  const { t } = useTranslation();
  return (
    <section id="skills" className="min-h-screen py-16 bg-white dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-white">{t('skills.title') || 'Habilidades'}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {skills.map((cat) => (
            <div 
              key={cat.category} 
              className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-white group">
                {cat.icon.startsWith('http') ? (
                  <img src={cat.icon} alt="" className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="w-6 h-6 transition-transform duration-300 group-hover:scale-110">
                    {cat.icon === 'code-xml' && <Code className="w-6 h-6" />}
                    {cat.icon === 'globe' && <Globe className="w-6 h-6" />}
                    {cat.icon === 'brain-circuit' && <BrainCircuit className="w-6 h-6" />}
                    {cat.icon === 'database' && <Database className="w-6 h-6" />}
                    {cat.icon === 'app-window' && <AppWindow className="w-6 h-6" />}
                  </div>
                )}
                {t(`skills.${cat.category}`)}
              </h3>
              <div className="flex flex-wrap gap-6">
                {cat.items.map((item) => (
                  <div 
                    key={item.name} 
                    className="flex flex-col items-center group"
                  >
                    <div className="relative">
                      <img
                        src={item.icon}
                        alt={item.name}
                        className="w-12 h-12 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
                      />
                    </div>
                    <span className="mt-2 text-sm text-white text-center group-hover:text-blue-300 transition-colors duration-300">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
