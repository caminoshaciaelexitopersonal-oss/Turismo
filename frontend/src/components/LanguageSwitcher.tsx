"use client";

import { useLanguage } from '@/contexts/LanguageContext';
import { FiGlobe } from 'react-icons/fi';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: 'es' | 'en') => {
    if (lang !== language) {
      setLanguage(lang);
    }
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
        <FiGlobe className="text-gray-500"/>
        <button
            onClick={() => handleLanguageChange('es')}
            className={`font-semibold ${language === 'es' ? 'text-blue-600 underline' : 'text-gray-600 hover:text-blue-600'}`}
        >
            ES
        </button>
        <span className="text-gray-300">|</span>
        <button
            onClick={() => handleLanguageChange('en')}
            className={`font-semibold ${language === 'en' ? 'text-blue-600 underline' : 'text-gray-600 hover:text-blue-600'}`}
        >
            EN
        </button>
    </div>
  );
};

export default LanguageSwitcher;