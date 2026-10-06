import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from '../hooks/useAnalytics'

const sections = ['hero', 'about', 'skills', 'projects', 'bookshelf']

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { trackSectionView, trackLanguageChange } = useAnalytics()
  const [activeSection, setActiveSection] = useState<string>('hero')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.intersectionRatio)
        }

        let next = sections[0]
        let best = 0
        for (const id of sections) {
          const ratio = ratios.get(id) ?? 0
          if (ratio > best) {
            best = ratio
            next = id
          }
        }

        setActiveSection((current) => {
          if (current !== next) {
            trackSectionView(next)
            return next
          }
          return current
        })
      },
      {
        root: null,
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )

    for (const id of sections) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [trackSectionView])

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('pt') ? 'en' : 'pt'
    i18n.changeLanguage(newLang)
    trackLanguageChange(newLang)
  }

  const isPortuguese = i18n.language.startsWith('pt')
  const languageButtonText = isPortuguese ? 'EN' : 'PT'
  const languageAria = `${languageButtonText}. ${
    isPortuguese ? t('navbar.switchToEnglish') : t('navbar.switchToPortuguese')
  }`

  return (
    <nav
      className="fixed w-full z-50 bg-black/80 backdrop-blur-md text-white"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-1"
            aria-label={menuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>

        <div
          id="main-menu"
          className={`flex-1 flex-col md:flex-row md:flex md:space-x-8 ${menuOpen ? 'flex' : 'hidden'} md:items-center md:justify-start bg-black/90 md:bg-transparent absolute md:static top-full left-0 w-full md:w-auto px-6 py-4 md:p-0 transition-all duration-300`}
          role="menu"
          aria-label="Navigation menu"
        >
          {sections.map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className={`block md:inline text-sm font-medium hover:text-blue-600 transition mb-4 md:mb-0 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 ${
                activeSection === section ? 'text-blue-600' : 'text-gray-300'
              }`}
              onClick={() => {
                if (menuOpen) setMenuOpen(false);
              }}
              role="menuitem"
              tabIndex={0}
              aria-current={activeSection === section ? 'page' : undefined}
            >
              {section === 'hero' ? t('navbar.home') : t(`navbar.${section}`)}
            </a>
          ))}
        </div>

        <button
          onClick={toggleLanguage}
          className="text-sm text-gray-500 hover:text-blue-500 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          aria-label={languageAria}
        >
          <img
            src={isPortuguese ? '/images/flags/br.svg' : '/images/flags/gb.svg'}
            alt={isPortuguese ? t('navbar.flagBrazil') : t('navbar.flagUK')}
            width={48}
            height={36}
            className="w-6 h-[18px]"
          />
          {languageButtonText}
        </button>
      </div>
    </nav>
  )
}
