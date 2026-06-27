import { useState } from 'react';
import axios from 'axios';

export function useVideoProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const processVideo = async (url) => {
    setIsProcessing(true);
    setProgress(0);
    setStatus('Initializing...');
    setError(null);
    setResults(null);

    try {
      setStatus('Extracting subtitles...');
      setProgress(20);

      const extractResponse = await axios.post('/api/extract-subtitles', { videoUrl: url });
      
      if (!extractResponse.data.success) {
        throw new Error(extractResponse.data.error || 'Failed to extract subtitles');
      }

      setStatus('Translating to Myanmar...');
      setProgress(50);

      setStatus('Generating voiceover...');
      setProgress(70);

      const ttsResponse = await axios.post('/api/convert-to-speech', {
        srtContent: extractResponse.data.srt,
        voice: 'alloy',
      });

      setProgress(90);
      setStatus('Finalizing...');

      // Create audio URL from response if audio data exists
      let audioUrl = null;
      if (ttsResponse.data.audio && ttsResponse.data.audio.length > 0) {
        const audioBlob = new Blob([new Uint8Array(ttsResponse.data.audio)], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(audioBlob);
      }

      setProgress(100);
      setStatus('Done!');

      setResults({
        srt: extractResponse.data.srt,
        audio: audioUrl,
        platform: extractResponse.data.platform,
        subtitleCount: extractResponse.data.subtitleCount,
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
