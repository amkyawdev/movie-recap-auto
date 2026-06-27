import { create } from 'zustand';

export const useVideoStore = create((set) => ({
  videoUrl: '',
  platform: null,
  subtitles: null,
  translatedSubtitles: null,
  audioUrl: null,
  isProcessing: false,
  progress: 0,
  error: null,

  setVideoUrl: (url) => set({ videoUrl: url }),
  setPlatform: (platform) => set({ platform }),
  setSubtitles: (subtitles) => set({ subtitles }),
  setTranslatedSubtitles: (translated) => set({ translatedSubtitles: translated }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (progress) => set({ progress }),
  setError: (error) => set({ error }),
  
  reset: () => set({
    videoUrl: '',
    platform: null,
    subtitles: null,
    translatedSubtitles: null,
    audioUrl: null,
    isProcessing: false,
    progress: 0,
    error: null,
  }),
}));
