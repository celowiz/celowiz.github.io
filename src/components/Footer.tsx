import { Mail, Github, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 mt-12">
      <div className="flex justify-center gap-6">
        <a href="mailto:seuemail@email.com" target="_blank" rel="noopener noreferrer">
          <Mail />
        </a>
        <a href="https://github.com/celowiz" target="_blank" rel="noopener noreferrer">
          <Github />
        </a>
        <a href="https://linkedin.com/in/seu-usuario" target="_blank" rel="noopener noreferrer">
          <Linkedin />
        </a>
      </div>
    </footer>
  );
}