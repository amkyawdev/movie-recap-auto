import { create } from 'zustand';

export const useSettingsStore = create((set) => ({
  language: 'myanmar',
  voice: 'alloy',
  speed: 1.0,
  autoPlay: false,
  darkMode: false,

  setLanguage: (language) => set({ language }),
  setVoice: (voice) => set({ voice }),
  setSpeed: (speed) => set({ speed }),
  setAutoPlay: (autoPlay) => set({ autoPlay }),
  setDarkMode: (darkMode) => set({ darkMode }),

  reset: () => set({
    language: 'myanmar',
    voice: 'alloy',
    speed: 1.0,
    autoPlay: false,
    darkMode: false,
  }),
}));
