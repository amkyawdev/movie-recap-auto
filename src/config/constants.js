export const LANGUAGES = [
  { code: 'my', name: 'Myanmar', native: 'မြန်မာ' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'ko', name: 'Korean', native: '한국어' },
  { code: 'th', name: 'Thai', native: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt' },
];

export const VOICES = [
  { id: 'alloy', name: 'Alloy', gender: 'neutral' },
  { id: 'echo', name: 'Echo', gender: 'male' },
  { id: 'fable', name: 'Fable', gender: 'male' },
  { id: 'onyx', name: 'Onyx', gender: 'male' },
  { id: 'nova', name: 'Nova', gender: 'female' },
  { id: 'shimmer', name: 'Shimmer', gender: 'female' },
];

export const PROCESSING_STEPS = [
  { id: 1, name: 'Extract Subtitles', description: 'Getting subtitles from video' },
  { id: 2, name: 'Translate', description: 'Converting to target language' },
  { id: 3, name: 'Generate TTS', description: 'Creating voiceover audio' },
  { id: 4, name: 'Finalize', description: 'Preparing download files' },
];
