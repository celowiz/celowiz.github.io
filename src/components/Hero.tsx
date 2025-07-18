// src/components/Hero.tsx
import { useTranslation } from "react-i18next";

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section id="hero" className="min-h-screen flex flex-col justify-center items-center text-center px-4 bg-gradient-to-b from-white to-gray-100 dark:from-gray-900 dark:to-black">
      <h1 className="text-4xl sm:text-6xl font-bold mb-4 text-gray-900 dark:text-white">
        {t("hero.name")}
      </h1>
      <p className="text-lg sm:text-2xl text-gray-700 dark:text-gray-300 mb-8 max-w-xl">
        {t("hero.description")}
      </p>
      <button
        onClick={() => {
          const element = document.getElementById('projects');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        className="px-6 py-3 bg-blue-600 text-white rounded-full text-lg font-medium hover:bg-blue-700 transition"
      >
        {t("hero.cta")}
      </button>
      
    </section>
  );
}
