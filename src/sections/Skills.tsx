import { useTranslation } from 'react-i18next';
import { AppWindow, BrainCircuit, Code, Database, Globe } from 'lucide-react';
import { AnimatedSection } from '../components/AnimatedSection';

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

function CategoryIcon({ icon }: { icon: string }) {
  if (icon.startsWith('/')) {
    return <img src={icon} alt="" width={18} height={18} className="h-[18px] w-[18px]" />;
  }
  if (icon === 'code-xml') return <Code className="h-[18px] w-[18px]" />;
  if (icon === 'globe') return <Globe className="h-[18px] w-[18px]" />;
  if (icon === 'brain-circuit') return <BrainCircuit className="h-[18px] w-[18px]" />;
  if (icon === 'database') return <Database className="h-[18px] w-[18px]" />;
  if (icon === 'app-window') return <AppWindow className="h-[18px] w-[18px]" />;
  return null;
}

export default function Skills() {
  const { t } = useTranslation();
  return (
    <section id="skills" className="scroll-mt-28 bg-ink py-24 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="font-serif text-4xl tracking-tight text-paper sm:text-5xl">{t('skills.title')}</h2>
        <div className="mt-12">
          {skills.map((cat, index) => (
            <AnimatedSection
              key={cat.category}
              delay={index * 40}
              className="group border-b border-white/10 py-6 transition-transform duration-200 hover:-translate-y-0.5"
            >
              <h3 className="mb-4 flex items-center gap-2 text-sm font-medium tracking-wide text-paper">
                <span className="text-teal">
                  <CategoryIcon icon={cat.icon} />
                </span>
                {t(`skills.${cat.category}`)}
              </h3>
              <ul className="flex flex-wrap gap-x-6 gap-y-3">
                {cat.items.map((item) => (
                  <li key={item.name} className="flex items-center gap-2 text-sm text-paper/80">
                    <img
                      src={item.icon}
                      alt=""
                      width={20}
                      height={20}
                      className="h-5 w-5"
                    />
                    {item.name}
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
