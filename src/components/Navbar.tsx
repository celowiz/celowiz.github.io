import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const sections = ['about', 'skills', 'projects']

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [activeSection, setActiveSection] = useState<string>('about')

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
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-50">
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
              {t(`navbar.${section}`)}
            </a>
          ))}
        </div>

        <button
          onClick={toggleLanguage}
          className="text-sm text-gray-500 hover:text-blue-500 transition"
        >
          {i18n.language === 'pt' ? 'EN' : 'PT'}
        </button>
      </div>
    </nav>
  )
}
