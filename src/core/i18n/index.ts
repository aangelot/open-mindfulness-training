import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './fr.json';

/** French is the source language; other languages can be added as JSON files. */
export const resources = { fr: { translation: fr } } as const;

export const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources,
  lng: 'fr', // When a 2nd language exists: detect it with expo-localization getLocales()
  fallbackLng: 'fr',
  interpolation: { escapeValue: false },
});
