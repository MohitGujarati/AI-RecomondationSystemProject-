// Simple preferences service to persist user-selected news categories
const KEY = 'news_prefs';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export function getPreferences() {
  if (typeof window === 'undefined' || !window.localStorage) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = safeParse(raw);
    if (!parsed || !Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error('getPreferences error', e);
    return [];
  }
}

export function savePreferences(categories) {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const toSave = Array.isArray(categories) ? categories : [];
    window.localStorage.setItem(KEY, JSON.stringify(toSave));
    return true;
  } catch (e) {
    console.error('savePreferences error', e);
    return false;
  }
}

export function clearPreferences() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    window.localStorage.removeItem(KEY);
    return true;
  } catch (e) {
    console.error('clearPreferences error', e);
    return false;
  }
}

export default {
  getPreferences,
  savePreferences,
  clearPreferences,
};
