import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from '../hooks/useAnalytics'

const sections = ['hero', 'about', 'skills', 'projects', 'bookshelf']

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const { trackSectionView, trackLanguageChange } = useAnalytics()
  const [activeSection, setActiveSection] = useState<string>('hero')

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const offsets = sections.map((id) => {
        const el = document.getElementById(id)
        if (!el) return { id, top: Infinity } // Se o elemento não existe, coloca no final
        return { id, top: el.offsetTop - 100 }
      }).filter(offset => offset.top !== Infinity) // Remove elementos não encontrados
        .sort((a, b) => a.top - b.top) // Ordena por posição

      if (offsets.length === 0) return // Se não há seções visíveis, sai

      // Encontra a seção atual baseado na posição do scroll
      let currentSection = offsets[0].id // Começa com a primeira seção

      for (const offset of offsets) {
        if (scrollY >= offset.top) {
          currentSection = offset.id
        } else {
          break // Como está ordenado, podemos parar quando scrollY < offset.top
        }
      }

      if (currentSection !== activeSection) {
        setActiveSection(currentSection)
        trackSectionView(currentSection)
      }
    }

    // Executa imediatamente para definir a seção inicial
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeSection, trackSectionView])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt'
    i18n.changeLanguage(newLang)
    trackLanguageChange(newLang)
  }

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav
      className="fixed w-full z-50 bg-black/80 backdrop-blur-md text-white"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Hamburger for mobile */}
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

        {/* Navbar links */}
        <div
          id="main-menu"
          className={`flex-1 flex-col md:flex-row md:flex md:space-x-8 ${menuOpen ? 'flex' : 'hidden'} md:items-center md:justify-start bg-black/90 md:bg-transparent absolute md:static top-full left-0 w-full md:w-auto px-6 py-4 md:p-0 transition-all duration-300`}
          role="menu"
          aria-label="Navigation menu"
        >
          {sections.map((section, index) => (
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

        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="text-sm text-gray-500 hover:text-blue-500 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          aria-label={`Mudar idioma para ${i18n.language === 'pt' ? 'Inglês' : 'Português'}`}
        >
          <img
            src={i18n.language === 'pt'
              ? 'https://flagcdn.com/24x18/br.png'
              : 'https://flagcdn.com/24x18/gb.png'}
            alt={`Bandeira ${i18n.language === 'pt' ? 'do Brasil' : 'do Reino Unido'}`}
            className="w-5 h-4"
            loading="lazy"
          />
          {i18n.language === 'pt' ? 'EN' : 'PT'}
        </button>
      </div>
    </nav>
  )
}
