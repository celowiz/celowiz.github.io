import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const sections = ['hero', 'about', 'skills', 'projects', 'second-brain']

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [activeSection, setActiveSection] = useState<string>('hero')

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const offsets = sections.map((id) => {
        const el = document.getElementById(id)
        if (!el) return { id, top: 0 }
        return { id, top: el.offsetTop - 100 }
      })

      const current = offsets.reduce((prev, curr) => {
        return scrollY >= curr.top ? curr : prev
      })

      setActiveSection(current.id)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt'
    i18n.changeLanguage(newLang)
  }

  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed w-full z-50 bg-black/60 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Hamburger for mobile */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white focus:outline-none"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Navbar links */}
        <div className={`flex-1 flex-col md:flex-row md:flex md:space-x-8 ${menuOpen ? 'flex' : 'hidden'} md:items-center md:justify-start bg-black/90 md:bg-transparent absolute md:static top-full left-0 w-full md:w-auto px-6 py-4 md:p-0 transition-all duration-300`}>
          {sections.map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className={`block md:inline text-sm font-medium hover:text-blue-600 transition mb-4 md:mb-0 ${
                activeSection === section ? 'text-blue-600' : 'text-gray-300'
              }`}
              onClick={() => {
                if (menuOpen) setMenuOpen(false);
              }}
            >
              {section === 'hero' ? t('navbar.home') :
                section === 'second-brain' ? t('navbar.second-brain') :
                t(`navbar.${section}`)}
            </a>
          ))}
          {/* Language toggle for mobile */}
          <button
            onClick={toggleLanguage}
            className="text-sm text-gray-500 hover:text-blue-500 transition flex items-center gap-2 mt-4 md:mt-0"
          >
            <img
              src={i18n.language === 'pt'
                ? 'https://flagcdn.com/24x18/br.png'
                : 'https://flagcdn.com/24x18/us.png'}
              alt="flag"
              className="w-5 h-4"
            />
            {i18n.language === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>

        {/* Language toggle for desktop */}
        <div className="hidden md:flex">
          <button
            onClick={toggleLanguage}
            className="text-sm text-gray-500 hover:text-blue-500 transition flex items-center gap-2"
          >
            <img
              src={i18n.language === 'pt'
                ? 'https://flagcdn.com/24x18/br.png'
                : 'https://flagcdn.com/24x18/gb.png'}
              alt="flag"
              className="w-5 h-4"
            />
            {i18n.language === 'pt' ? 'EN' : 'PT'}
          </button>
        </div>
      </div>
    </nav>
  )
}
