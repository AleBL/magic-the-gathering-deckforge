import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaChevronDown } from 'react-icons/fa';

function SelectLanguage() {
  const { i18n, t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language || 'en');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (i18n.language && i18n.language !== language) {
      setLanguage(i18n.language);
    }
  }, [i18n.language, language]);

  // Fechar o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const languageHandler = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    setIsOpen(false);
  };

  const languages = [
    {
      value: 'English',
      key: 'en',
      iconPath: new URL(`../assets/locales/en.svg`, import.meta.url).href
    },
    {
      value: 'Español',
      key: 'es',
      iconPath: new URL(`../assets/locales/es.svg`, import.meta.url).href
    },
    {
      value: 'Português',
      key: 'pt',
      iconPath: new URL(`../assets/locales/pt.svg`, import.meta.url).href
    }
  ];

  const selectedLang = languages.find((l) => l.key === language) || languages[0];

  return (
    <div className="dropdown-container" ref={dropdownRef}>
      <div className="flex flex-col items-start gap-1">
        <label className="form-label ml-1">{t('selectLanguage')}</label>

        <button type="button" onClick={() => setIsOpen(!isOpen)} className="dropdown-trigger">
          <div className="flex items-center gap-2">
            <img
              src={selectedLang.iconPath}
              alt={selectedLang.value}
              className="h-5 w-5 rounded-full object-cover shadow-sm"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{selectedLang.value}</span>
          </div>
          <FaChevronDown
            className={`text-gray-500 dark:text-gray-400 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="dropdown-menu animate-fadeIn">
          <ul className="py-1">
            {languages.map(({ value, key, iconPath }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => languageHandler(key)}
                  className={`dropdown-item ${language === key ? 'dropdown-item-active' : ''}`}
                >
                  <img src={iconPath} alt={value} className="h-5 w-5 rounded-full object-cover shadow-sm" />
                  {value}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default SelectLanguage;
