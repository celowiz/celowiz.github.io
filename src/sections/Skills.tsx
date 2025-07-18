import React from 'react';

const skills = [
  {
    category: 'Linguagens de Programação',
    icon: '📦',
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
        name: 'JavaScript / TypeScript',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
      },
      {
        name: 'SQL',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg',
      },
    ],
  },
  {
    category: 'Frameworks e Ferramentas Web',
    icon: '⚙️',
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
    category: 'Bibliotecas Python',
    icon: '📚',
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
    category: 'Machine Learning / Data Science',
    icon: '🧠',
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
    category: 'Banco de Dados',
    icon: '🗄️',
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
    category: 'Outros',
    icon: '📈',
    items: [
      {
        name: 'Git / GitHub',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg',
      },
      {
        name: 'Streamlit',
        icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/streamlit/streamlit-original.svg', // Placeholder
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
  return (
    <section id="skills" className="min-h-screen py-16 bg-white dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-10 text-center text-white">Habilidades</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {skills.map((cat) => (
            <div key={cat.category} className="bg-gray-800 rounded-xl shadow p-4 border-1 border-white">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">{cat.icon} {cat.category}</h3>
              <div className="flex flex-wrap gap-6">
                {cat.items.map((item) => (
                  <div key={item.name} className="flex flex-col items-center group">
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="w-12 h-12 filter grayscale group-hover:filter-none transition duration-300"
                    />
                    <span className="mt-2 text-sm text-white text-center">{item.name}</span>
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
