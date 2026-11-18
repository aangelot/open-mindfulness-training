/**
 * External pages linked from the Profile. Change a URL here, nowhere else.
 */
import { openURL } from 'expo-linking';
import { router } from 'expo-router';
import { openBrowserAsync } from 'expo-web-browser';

const SITE = 'https://www.openmindfulness.net';
const REPO = 'https://github.com/aangelot/open-mindfulness-training';

export const LINKS = {
  site: `${SITE}/`,
  seminars: `${SITE}/les-seminaires-retraites-online-et-residentiel/`,
  structures: `${SITE}/structures-et-cooperations`,
  contact: `${SITE}/contact/`,
  /** Opened in the system browser: no payment happens in the app. */
  donate: 'https://www.buddha.university/universite/modele-economique-du-don/',
  repo: REPO,
  issues: `${REPO}/issues`,
  /** Public URL of the privacy policy, given to the Play Store. */
  privacy: `${REPO}/blob/main/docs/confidentialite.md`,
  contentLicense: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.fr',
  codeLicense: `${REPO}/blob/main/LICENSE`,
} as const;

/** Opens a page in an in-app browser tab (Custom Tab on Android, Safari view on iOS). */
export const openPage = (url: string) => void openBrowserAsync(url).catch(() => openURL(url));

/** Opens a page in the system browser, outside the app. */
export const openExternal = (url: string) => void openURL(url);

// --- Navigation (routes live in src/app/(tabs)/profil) -------------------------

export const openStats = () => router.push('/profil/statistiques');
export const openPrivacy = () => router.push('/profil/confidentialite');
export const openLegal = () => router.push('/profil/mentions-legales');
