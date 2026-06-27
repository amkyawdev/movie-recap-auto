import { useState, useCallback } from 'react';
import axios from 'axios';

export function useAudioGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const generateAudio = useCallback(async (text, voice = 'alloy') => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await axios.post('/api/convert-to-speech', {
        text,
        voice,
      });

      if (response.data.success) {
        const blob = new Blob(response.data.audio, { type: 'audio/mpeg' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        return url;
      } else {
        throw new Error(response.data.error || 'Failed to generate audio');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const reset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setError(null);
  }, [audioUrl]);

  return {
    isGenerating,
    audioUrl,
    error,
    generateAudio,
    reset,
  };
}
