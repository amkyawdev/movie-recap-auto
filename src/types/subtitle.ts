export interface Subtitle {
  index: number;
  startTime: string;
  endTime: string;
  text: string;
}

export interface SRTFile {
  subtitles: Subtitle[];
  duration: number;
}

export interface SubtitleFormat {
  type: 'srt' | 'vtt' | 'ass';
  content: string;
}
