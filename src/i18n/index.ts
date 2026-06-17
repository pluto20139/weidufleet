import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './zh';
import en from './en';

const getInitialLang = () => {
  try {
    const data = localStorage.getItem('weidu-fleet-storage');
    if (data) {
      const parsed = JSON.parse(data);
      if (parsed.state && parsed.state.lang) {
        return parsed.state.lang;
      }
    }
  } catch (e) {
    // ignore
  }
  return 'en';
};

i18n.use(initReactI18next).init({
  resources: { zh: { translation: zh }, en: { translation: en } },
  lng: getInitialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
