import { useTranslation } from 'react-i18next';
import { Code, Globe, BrainCircuit, Database, AppWindow } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';

// Icons from https://devicon.dev/ via
// https://cdn.jsdelivr.net/gh/devicons/devicon/icons/<name>/<name>-original.svg
const devicon = (name: string) => `/icons/${name}/${name}-original.svg`;

const skills = [
  {
    category: 'languages',
    icon: 'code-xml',
    items: [
      { name: 'Python', icon: devicon('python') },
      { name: 'R', icon: devicon('r') },
      { name: 'JavaScript', icon: devicon('javascript') },
      { name: 'SQL', icon: devicon('mysql') },
    ],
  },
  {
    category: 'frameworks',
    icon: 'globe',
    items: [
      { name: 'Next.js', icon: devicon('nextjs') },
      { name: 'Vite', icon: devicon('vite') },
      { name: 'React', icon: devicon('react') },
      { name: 'Node.js', icon: devicon('nodejs') },
      { name: 'FastAPI', icon: devicon('fastapi') },
      { name: 'Flask', icon: devicon('flask') },
      { name: 'HTML5', icon: devicon('html5') },
      { name: 'CSS3', icon: devicon('css3') },
    ],
  },
  {
    category: 'pythonLibs',
    icon: devicon('python'),
    items: [
      { name: 'Pandas', icon: devicon('pandas') },
      { name: 'NumPy', icon: devicon('numpy') },
      { name: 'Scikit-learn', icon: devicon('scikitlearn') },
      { name: 'Matplotlib', icon: devicon('matplotlib') },
      { name: 'Plotly', icon: devicon('plotly') },
    ],
  },
  {
    category: 'ml',
    icon: 'brain-circuit',
    items: [
      { name: 'TensorFlow', icon: devicon('tensorflow') },
      { name: 'Spyder', icon: devicon('spyder') },
    ],
  },
  {
    category: 'databases',
    icon: 'database',
    items: [
      { name: 'PostgreSQL', icon: devicon('postgresql') },
      { name: 'MySQL', icon: devicon('mysql') },
      { name: 'MongoDB', icon: devicon('mongodb') },
    ],
  },
  {
    category: 'others',
    icon: 'app-window',
    items: [
      { name: 'Git / GitHub', icon: devicon('github') },
      { name: 'Streamlit', icon: devicon('streamlit') },
      { name: 'Jupyter', icon: devicon('jupyter') },
      { name: 'VSCode', icon: devicon('vscode') },
    ],
  },
];

export default function Skills() {
  const { t } = useTranslation();
  return (
    <section id="skills" className="min-h-screen py-16 bg-gray-900">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-center text-white">{t('skills.title') || 'Habilidades'}</h2>
        <p className="text-center text-gray-300 mb-10 max-w-3xl mx-auto">
          <span className="text-blue-400 font-medium">{t('skills.ai')}: </span>
          {t('skills.aiTools')}
        </p>
        <div className="grid md:grid-cols-2 gap-8">
          {skills.map((cat, index) => (
            <AnimatedSection
              key={cat.category}
              animation="fadeInUp"
              delay={index * 200}
              className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 transform hover:scale-105"
            >
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-3 text-white group">
                {cat.icon.startsWith('/') || cat.icon.startsWith('http') ? (
                  <img src={cat.icon} alt="" width={24} height={24} className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
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
                        width={48}
                        height={48}
                        className="w-12 h-12 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
                      />
                    </div>
                    <span className="mt-2 text-sm text-white text-center group-hover:text-blue-300 transition-colors duration-300">{item.name}</span>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
