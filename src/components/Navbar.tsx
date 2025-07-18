import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const sections = ['hero', 'about', 'skills', 'projects']

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

  return (
    <nav className="fixed w-full z-50 bg-black/60 backdrop-blur-md text-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex space-x-8">
          {sections.map((section) => (
            <a
              key={section}
              href={`#${section}`}
              className={`text-sm font-medium hover:text-blue-600 transition ${
                activeSection === section ? 'text-blue-600' : 'text-gray-800'
              }`}
            >
              {section === 'hero' ? t('navbar.home') : t(`navbar.${section}`)}
            </a>
          ))}
        </div>

        <button
          onClick={toggleLanguage}
          className="text-sm text-gray-500 hover:text-blue-500 transition flex items-center gap-2"
        >
          <img
            src={i18n.language === 'pt'
              ? 'https://flagcdn.com/24x18/br.png'
              : 'https://flagcdn.com/24x18/us.png'}
            alt={i18n.language === 'pt' ? 'Bandeira do Brasil' : 'Bandeira dos Estados Unidos'}
            width={24}
            height={18}
            style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: '2px' }}
          />
          {i18n.language === 'pt' ? 'EN' : 'PT'}
        </button>
      </div>
    </nav>
  )
}
