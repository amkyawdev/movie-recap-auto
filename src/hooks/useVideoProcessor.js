import { useState } from 'react';

export function useVideoProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const processVideo = async (audioFile, options = {}) => {
    const { targetLanguage = 'Myanmar', voice = 'alloy' } = options;
    
    setIsProcessing(true);
    setProgress(0);
    setStatus('Initializing...');
    setError(null);
    setResults(null);

    // This hook is not used directly anymore - audio processing is done in the component
    setIsProcessing(false);
    return null;
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
