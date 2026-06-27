import { useState, useCallback } from 'react';

export function useFFmpeg() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);

  const loadFFmpeg = useCallback(async () => {
    if (isLoaded) return true;
    
    setStatus('Loading FFmpeg...');
    setProgress(10);
    
    try {
      // Dynamic import to avoid SSR issues
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');
      
      const ffmpeg = new FFmpeg();
      
      ffmpeg.on('progress', ({ progress }) => {
        setProgress(Math.round(progress * 100));
      });
      
      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      setStatus('Initializing FFmpeg...');
      setProgress(30);
      
      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
      });

      setProgress(100);
      setIsLoaded(true);
      setStatus('FFmpeg ready!');
      
      return { ffmpeg, fetchFile };
    } catch (err) {
      setError(err.message || 'Failed to load FFmpeg');
      setStatus('');
      return null;
    }
  }, [isLoaded]);

  const processVideo = useCallback(async (options = {}) => {
    const { videoUrl, srtContent, audioBase64, mode = 'audio' } = options;
    
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    
    try {
      const ffmpegLib = await loadFFmpeg();
      if (!ffmpegLib) throw new Error('FFmpeg not loaded');
      
      const { ffmpeg, fetchFile } = ffmpegLib;
      
      if (mode === 'audio') {
        // Create audio file from base64
        setStatus('Creating audio file...');
        setProgress(20);
        
        if (audioBase64) {
          const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
          await ffmpeg.writeFile('audio.mp3', audioData);
        }
        
        setProgress(100);
        setStatus('Audio ready!');
        
        return { success: true, type: 'audio' };
      }
      
      if (mode === 'merge') {
        // Download video
        setStatus('Downloading video...');
        setProgress(10);
        
        const videoResponse = await fetch(videoUrl);
        const videoData = await videoResponse.arrayBuffer();
        await ffmpeg.writeFile('input.mp4', new Uint8Array(videoData));
        
        // Write SRT
        setStatus('Adding subtitles...');
        setProgress(40);
        
        if (srtContent) {
          await ffmpeg.writeFile('subtitles.srt', new TextEncoder().encode(srtContent));
        }
        
        // Write audio if provided
        setStatus('Adding audio...');
        setProgress(60);
        
        if (audioBase64) {
          const audioData = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
          await ffmpeg.writeFile('audio.mp3', audioData);
        }
        
        // Merge video with audio (replace audio track)
        setStatus('Merging files...');
        setProgress(80);
        
        if (audioBase64) {
          await ffmpeg.exec([
            '-i', 'input.mp4',
            '-i', 'audio.mp3',
            '-c:v', 'copy',
            '-c:a', 'aac',
            '-map', '0:v:0',
            '-map', '1:a:0',
            'output.mp4'
          ]);
        } else if (srtContent) {
          // Burn subtitles into video
          await ffmpeg.exec([
            '-i', 'input.mp4',
            '-vf', `subtitles=subtitles.srt`,
            'output.mp4'
          ]);
        }
        
        setProgress(100);
        setStatus('Processing complete!');
        
        // Read output
        const data = await ffmpeg.readFile('output.mp4');
        const blob = new Blob([data.buffer], { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        
        return { success: true, url, type: 'video' };
      }
      
    } catch (err) {
      setError(err.message || 'Processing failed');
      return { success: false, error: err.message };
    } finally {
      setIsProcessing(false);
    }
  }, [loadFFmpeg]);

  const cancel = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
  }, []);

  return {
    isLoaded,
    isProcessing,
    progress,
    status,
    error,
    loadFFmpeg,
    processVideo,
    cancel,
  };
}
