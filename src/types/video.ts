export interface Video {
  id: string;
  url: string;
  platform: 'youtube' | 'tiktok' | 'unknown';
  title?: string;
  thumbnail?: string;
  duration?: number;
  createdAt: Date;
}

export interface ProcessedVideo extends Video {
  subtitles?: Subtitle[];
  translatedSubtitles?: Subtitle[];
  audioUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface Subtitle {
  id: number;
  startTime: string;
  endTime: string;
  text: string;
  translation?: string;
}

export interface ProcessingProgress {
  currentStep: number;
  totalSteps: number;
  status: string;
  progress: number;
}
