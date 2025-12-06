import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(HttpApi)
  .init({
    // Use top 4 widely used languages: English, Spanish, Mandarin (zh), Hindi
    supportedLngs: ['en', 'es', 'zh', 'hi'],
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: { useSuspense: false },
  });

export default i18n;