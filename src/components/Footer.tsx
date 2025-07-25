// Declaração global para o Google Analytics gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
import React from 'react';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-white py-8 border-t border-gray-700">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center justify-center text-center">
        <p className="text-lg font-semibold mb-1">{t('footer.madeBy')}</p>
        <p className="text-sm text-gray-400 mb-4">&copy; {year} {t('footer.copyright')}</p>
        <div className="flex gap-8 mb-2 justify-center items-center">
          <a
            href="mailto:marcelo.wizen@gmail.com"
            className="hover:text-blue-400 transition"
            aria-label="Email"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { if (window.gtag) window.gtag('event', 'click_email', { event_category: 'Footer', event_label: 'Email' }); }}
          >
            {/* Envelope Heroicon outline */}
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-.876 1.789l-7.5 6a2.25 2.25 0 01-2.748 0l-7.5-6A2.25 2.25 0 012.25 6.993V6.75"/></svg>
          </a>
          <a
            href="https://www.linkedin.com/in/marcelowizenberg/"
            className="hover:text-blue-400 transition"
            aria-label="LinkedIn"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { if (window.gtag) window.gtag('event', 'click_linkedin', { event_category: 'Footer', event_label: 'LinkedIn' }); }}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.268c-.966 0-1.75-.784-1.75-1.75s.784-1.75 1.75-1.75 1.75.784 1.75 1.75-.784 1.75-1.75 1.75zm15.5 11.268h-3v-5.604c0-1.337-.025-3.063-1.868-3.063-1.868 0-2.154 1.459-2.154 2.968v5.699h-3v-10h2.881v1.367h.041c.401-.761 1.379-1.563 2.841-1.563 3.04 0 3.601 2.002 3.601 4.604v5.592z"/></svg>
          </a>
          <a
            href="https://github.com/celowiz"
            className="hover:text-blue-400 transition"
            aria-label="GitHub"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { if (window.gtag) window.gtag('event', 'click_github', { event_category: 'Footer', event_label: 'GitHub' }); }}
          >
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.262.82-.582 0-.288-.012-1.243-.017-2.252-3.338.726-4.042-1.415-4.042-1.415-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.304-5.466-1.332-5.466-5.931 0-1.31.469-2.381 1.236-3.221-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.984-.399 3.003-.404 1.018.005 2.046.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.119 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.804 5.625-5.475 5.921.43.372.823 1.104.823 2.226 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.373-12-12-12z"/></svg>
          </a>
          <a
            href="https://x.com/marcelo_wz"
            className="hover:text-blue-400 transition"
            aria-label="Twitter"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { if (window.gtag) window.gtag('event', 'click_twitter', { event_category: 'Footer', event_label: 'Twitter' }); }}
          >
            {/* X (Twitter) SVG */}
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M17.53 3H21.5L14.36 10.66L22.75 21H16.44L11.38 14.62L5.77 21H1.8L9.34 12.82L1.25 3H7.73L12.33 8.84L17.53 3ZM16.41 19H18.23L7.66 5H5.7L16.41 19Z"/></svg>
          </a>
        </div>
        <p className="text-xs text-gray-500 text-center">{t('footer.tech')}</p>
      </div>
    </footer>
  );
}