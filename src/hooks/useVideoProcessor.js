import { useState } from 'react';
import axios from 'axios';

export function useVideoProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const processVideo = async (url, options = {}) => {
    const { translate = false, targetLanguage = 'Myanmar', voice = 'alloy' } = options;
    
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
        translate,
        targetLanguage 
      });
      
      if (!extractResponse.data.success) {
        setError(extractResponse.data.error || 'Failed to extract subtitles');
        setIsProcessing(false);
        return null;
      }

      // Show original subtitles immediately
      setProgress(60);
      setStatus('Subtitles extracted!');

      // Generate TTS if available
      setStatus('Generating voiceover...');
      setProgress(70);

      let ttsResponse;
      try {
        ttsResponse = await axios.post('/api/convert-to-speech', {
          srtContent: extractResponse.data.srt,
          voice: voice,
          targetLanguage,
        });
      } catch (ttsError) {
        console.log('TTS generation skipped:', ttsError.message);
        ttsResponse = { data: { audio: '', hasAudio: false, message: 'TTS not available' } };
      }

      setProgress(90);
      setStatus('Finalizing...');

      // Create audio URL from base64 response
      let audioUrl = null;
      if (ttsResponse.data.audio && ttsResponse.data.hasAudio) {
        try {
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
        message: ttsResponse.data.message || extractResponse.data.message,
      });

      return results;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      setError(errorMsg);
      setStatus('Error');
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
