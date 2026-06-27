export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ExtractSubtitlesRequest {
  videoUrl: string;
}

export interface ExtractSubtitlesResponse extends ApiResponse {
  data?: {
    srt: string;
    platform: string;
    subtitleCount: number;
  };
}

export interface ConvertToSpeechRequest {
  text?: string;
  srtContent?: string;
  voice?: string;
  speed?: number;
}

export interface ConvertToSpeechResponse extends ApiResponse {
  data?: {
    audio: ArrayBuffer;
    voice: string;
  };
}
