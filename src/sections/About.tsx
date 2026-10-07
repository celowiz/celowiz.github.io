import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';

type TimelineItem = {
  company: string;
  role: string;
  period: string;
};

function useCounter(to: number, duration = 1500, isVisible = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const increment = to / (duration / 16);
    const interval = setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(interval);
  }, [to, duration, isVisible]);
  return count;
}

function useIntersectionObserver(ref: React.RefObject<HTMLElement | null>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [ref]);

  return isVisible;
}

function TimelineList({ items }: { items: TimelineItem[] }) {
  return (
    <ol className="relative border-l-2 border-gray-700">
      {items.map((item) => (
        <li key={`${item.company}-${item.period}`} className="mb-10 ml-6 last:mb-0">
          <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full ring-8 ring-gray-800">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
          </span>
          <h4 className="text-xl font-bold text-white">
            {item.company} <span className="text-blue-400">· {item.role}</span>
          </h4>
          <span className="block text-sm text-gray-400 mt-1">{item.period}</span>
        </li>
      ))}
    </ol>
  );
}

export default function About() {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const isVisible = useIntersectionObserver(sectionRef);
  const years = useCounter(9, 1500, isVisible);
  const projects = useCounter(15, 1500, isVisible);
  const experience = t('about.experience', { returnObjects: true }) as TimelineItem[];
  const education = t('about.education', { returnObjects: true }) as TimelineItem[];

  return (
    <section ref={sectionRef} id="about" className="min-h-screen py-16 bg-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8 text-center text-white">{t('about.title')}</h2>
        <div className="bg-gray-900 rounded-xl p-8 mb-8 shadow-lg border border-gray-700">
          <p className="text-lg leading-relaxed text-gray-200">
            {t('about.description')}
          </p>
        </div>
        <div className="flex justify-center gap-12 mb-12">
          <div className="text-center bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700 transform hover:scale-105 transition-transform duration-300">
            <span className="text-4xl font-bold text-green-400">{years}+</span>
            <div className="text-gray-300 font-medium mt-2">{t('about.years')}</div>
          </div>
          <div className="text-center bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-700 transform hover:scale-105 transition-transform duration-300">
            <span className="text-4xl font-bold text-green-400">{projects}+</span>
            <div className="text-gray-300 font-medium mt-2">{t('about.projects')}</div>
          </div>
        </div>
        <div className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-center text-white">{t('about.experienceTitle')}</h3>
          <TimelineList items={experience} />
        </div>
        <div>
          <h3 className="text-2xl font-semibold mb-6 text-center text-white">{t('about.educationTitle')}</h3>
          <TimelineList items={education} />
        </div>
      </div>
    </section>
  );
}
