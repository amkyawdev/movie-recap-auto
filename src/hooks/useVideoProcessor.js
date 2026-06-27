import { useState } from 'react';
import axios from 'axios';

export function useVideoProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const processVideo = async (url, targetLanguage = 'Myanmar') => {
    setIsProcessing(true);
    setProgress(0);
    setStatus('Initializing...');
    setError(null);
    setResults(null);

    try {
      setStatus('Extracting subtitles...');
      setProgress(10);

      const extractResponse = await axios.post('/api/extract-subtitles', { 
        videoUrl: url,
        targetLanguage 
      });
      
      if (!extractResponse.data.success) {
        throw new Error(extractResponse.data.error || 'Failed to extract subtitles');
      }

      setStatus('Translating subtitles...');
      setProgress(40);

      // Small delay to show translation progress
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus('Generating voiceover...');
      setProgress(60);

      const ttsResponse = await axios.post('/api/convert-to-speech', {
        srtContent: extractResponse.data.srt,
        voice: 'alloy',
        targetLanguage,
      });

      setProgress(90);
      setStatus('Finalizing...');

      // Create audio URL from base64 response
      let audioUrl = null;
      if (ttsResponse.data.audio && ttsResponse.data.hasAudio) {
        try {
          // Convert base64 to Blob
          const response = await fetch(`data:audio/mp3;base64,${ttsResponse.data.audio}`);
          const blob = await response.blob();
          audioUrl = URL.createObjectURL(blob);
        } catch (e) {
          console.log('Audio creation failed:', e);
        }
      }

      setProgress(100);
      setStatus('Done!');

      setResults({
        srt: extractResponse.data.srt,
        originalSrt: extractResponse.data.originalSrt,
        audio: audioUrl,
        hasAudio: ttsResponse.data.hasAudio,
        platform: extractResponse.data.platform,
        subtitleCount: extractResponse.data.subtitleCount,
        videoId: extractResponse.data.videoId,
        message: ttsResponse.data.message,
      });

      return results;
    } catch (err) {
      setError(err.message || 'Something went wrong');
      setStatus('Error: ' + err.message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
    setResults(null);
    setError(null);
  };

  return {
    isProcessing,
    progress,
    status,
    results,
    error,
    processVideo,
    reset,
  };
}
