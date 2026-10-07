import { useTranslation } from 'react-i18next';
import { useAnalytics } from '../hooks/useAnalytics';
import { cn } from '../lib/cn';

type LanguageToggleProps = {
  scrolled?: boolean;
};

export default function LanguageToggle({ scrolled = false }: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const { trackLanguageChange } = useAnalytics();
  const isPortuguese = i18n.language.startsWith('pt');
  const languageButtonText = isPortuguese ? 'EN' : 'PT';
  const languageAria = `${languageButtonText}. ${
    isPortuguese ? t('navbar.switchToEnglish') : t('navbar.switchToPortuguese')
  }`;

  const toggleLanguage = () => {
    const newLang = isPortuguese ? 'en' : 'pt';
    i18n.changeLanguage(newLang);
    trackLanguageChange(newLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className={cn(
        'fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex h-10 items-center gap-2 rounded-full px-3 text-sm text-paper/80 transition-colors hover:text-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal',
        scrolled && 'border border-white/10 bg-black/55 backdrop-blur-md',
      )}
      aria-label={languageAria}
    >
      <img
        src={isPortuguese ? '/images/flags/br.svg' : '/images/flags/gb.svg'}
        alt={isPortuguese ? t('navbar.flagBrazil') : t('navbar.flagUK')}
        width={48}
        height={36}
        className="h-[18px] w-6"
      />
      {languageButtonText}
    </button>
  );
}
