import { useEffect, useState } from 'react';

function useCounter(to: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
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
  }, [to, duration]);
  return count;
}

const timeline = [
  {
    company: "Empresa A",
    role: "Quant Developer",
    period: "2021 - Presente",
    description: "Desenvolvimento de modelos quantitativos para trading algorítmico e análise de dados financeiros."
  },
  {
    company: "Empresa B",
    role: "Data Scientist",
    period: "2018 - 2021",
    description: "Implementação de pipelines de dados e automação de análises para o mercado financeiro."
  },
  {
    company: "Empresa C",
    role: "Estagiário em Finanças Quantitativas",
    period: "2016 - 2018",
    description: "Apoio em pesquisas quantitativas e desenvolvimento de ferramentas para análise de risco."
  }
];

export default function About() {
  const years = useCounter(8);
  const projects = useCounter(15);

  return (
    <section id="about" className="min-h-screen py-16 bg-gray-800 text-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-4xl font-bold mb-8 text-center">Sobre Mim</h2>
        <div className="bg-gray-900 rounded-xl p-8 mb-8">
          <p className="mb-4">
            Sou um desenvolvedor especializado em análise quantitativa e desenvolvimento de estratégias para o mercado de capitais brasileiro. Com experiência em Python, JavaScript e frameworks modernos, foco na criação de soluções robustas para trading algorítmico e análise de dados financeiros.
          </p>
          <p>
            Minha paixão está em transformar dados complexos em insights acionáveis, desenvolvendo algoritmos que podem identificar oportunidades no mercado brasileiro de ações, commodities e derivativos.
          </p>
        </div>
        <div className="flex justify-center gap-12 mb-12">
          <div className="text-center">
            <span className="text-4xl font-bold text-green-400">{years}+</span>
            <div className="text-gray-200">Anos de Experiência</div>
          </div>
          <div className="text-center">
            <span className="text-4xl font-bold text-green-400">{projects}+</span>
            <div className="text-gray-200">Projetos Desenvolvidos</div>
          </div>
        </div>
        <div>
          <h3 className="text-2xl font-semibold mb-6 text-center">Minha Trajetória</h3>
          <ol className="relative border-l border-gray-700">
            {timeline.map((item, idx) => (
              <li key={idx} className="mb-10 ml-6">
                <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full ring-8 ring-gray-800">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="10" /></svg>
                </span>
                <h4 className="text-xl font-bold">{item.role} <span className="text-blue-400">@ {item.company}</span></h4>
                <span className="block text-sm text-gray-400 mb-2">{item.period}</span>
                <p className="text-gray-200">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}