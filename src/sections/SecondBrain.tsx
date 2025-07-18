import React, { useState } from 'react';

const resources = [
  {
    title: 'How to Build a Quant Strategy',
    description: 'Artigo detalhado sobre construção de estratégias quantitativas.',
    link: 'https://example.com/quant-strategy',
    format: 'Artigo',
    tags: ['Quant Strategies', 'Python', 'Finance'],
  },
  {
    title: 'React for Beginners',
    description: 'Curso introdutório de React para web developers.',
    link: 'https://example.com/react-course',
    format: 'Curso',
    tags: ['Web Dev', 'React', 'JavaScript', 'MOOC'],
  },
  {
    title: 'Python Data Science Handbook',
    description: 'Livro referência para Data Science com Python.',
    link: 'https://example.com/python-ds-handbook',
    format: 'Livro',
    tags: ['Python', 'Data Science', 'Libraries'],
  },
  {
    title: 'Deep Learning Specialization',
    description: 'Certificação Coursera sobre Deep Learning.',
    link: 'https://example.com/deep-learning',
    format: 'Certificação',
    tags: ['Deep Learning', 'Coursera', 'MOOC'],
  },
  {
    title: 'Pandas Documentation',
    description: 'Documentação oficial da biblioteca Pandas.',
    link: 'https://pandas.pydata.org/docs/',
    format: 'Ferramenta',
    tags: ['Python', 'Libraries', 'Data Science'],
  },
  {
    title: 'UI Inspiration Gallery',
    description: 'Blog com inspirações de UI/UX.',
    link: 'https://example.com/ui-gallery',
    format: 'Blog',
    tags: ['UI/UX', 'Web Dev', 'Design'],
  },
];

const allFormats = Array.from(new Set(resources.map(r => r.format)));
const allTags = Array.from(new Set(resources.flatMap(r => r.tags)));

export default function SecondBrain() {
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filtered = resources.filter(r =>
    (selectedFormat === '' || r.format === selectedFormat) &&
    (selectedTags.length === 0 || selectedTags.every(tag => r.tags.includes(tag)))
  );

  return (
    <section id="second-brain" className="min-h-screen py-16 bg-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-4">
        <h2 className="text-3xl font-bold mb-6 text-center">Second Brain</h2>
        <p className="mb-8 text-center text-gray-300">
          Aqui compartilho artigos, vídeos, cursos, certificações e links que considero essenciais para minha formação e atuação profissional. Este espaço é um reflexo do meu processo contínuo de aprendizado e organização de ideias.
        </p>
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <select
            className="bg-gray-800 text-white px-3 py-2 rounded"
            value={selectedFormat}
            onChange={e => setSelectedFormat(e.target.value)}
          >
            <option value="">Todos os formatos</option>
            {allFormats.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
          <div className="w-full flex flex-wrap gap-2 items-center justify-center mt-4">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`px-3 py-1 rounded-full border text-sm ${selectedTags.includes(tag) ? 'bg-blue-600 border-blue-400 text-white' : 'bg-gray-800 border-gray-600 text-gray-300'}`}
                onClick={() => setSelectedTags(selectedTags.includes(tag)
                  ? selectedTags.filter(t => t !== tag)
                  : [...selectedTags, tag])}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-xl">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left">Título</th>
                <th className="px-4 py-2 text-left">Formato</th>
                <th className="px-4 py-2 text-left">Tags</th>
                <th className="px-4 py-2 text-left">Link</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => (
                <tr key={idx} className="border-t border-gray-700">
                  <td className="px-4 py-2 font-semibold">{r.title}<div className="text-xs text-gray-400 font-normal">{r.description}</div></td>
                  <td className="px-4 py-2">{r.format}</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {r.tags.map(tag => {
                        // Cores diferentes para algumas tags conhecidas
                        let color = 'bg-gray-700 text-gray-200';
                        if (/quant|finance/i.test(tag)) color = 'bg-green-700 text-green-200';
                        else if (/python|data|ml|deep|pandas|numpy|scikit/i.test(tag)) color = 'bg-yellow-700 text-yellow-200';
                        else if (/web|react|javascript|ui|ux|front/i.test(tag)) color = 'bg-blue-700 text-blue-200';
                        else if (/mooc|curso|cert/i.test(tag)) color = 'bg-purple-700 text-purple-200';
                        else if (/blog|artigo|paper/i.test(tag)) color = 'bg-pink-700 text-pink-200';
                        else if (/ferramenta|tool/i.test(tag)) color = 'bg-orange-700 text-orange-200';
                        return (
                          <span key={tag} className={`${color} px-2 py-1 rounded text-xs`}>{tag}</span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Abrir</a>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-400">Nenhum recurso encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
} 