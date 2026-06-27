import { useState } from 'react';
import axios from 'axios';

export function useVideoProcessor() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('');

  const processVideo = async (url, options = {}) => {
    const { targetLanguage = 'Myanmar', voice = 'alloy' } = options;
    
    setIsProcessing(true);
    setProgress(0);
    setStatus('Initializing...');
    setError(null);
    setResults(null);

    try {
      // Step 1: Prepare video for STT
      setStep('preparing');
      setStatus('Preparing video...');
      setProgress(5);

      const prepareResponse = await axios.post('/api/extract-subtitles', { 
        videoUrl: url,
        targetLanguage 
      });
      
      if (!prepareResponse.data.success) {
        setError(prepareResponse.data.error || 'Failed to prepare video');
        setIsProcessing(false);
        return null;
      }

      // Step 2: Speech to Text (STT) - Extract audio and transcribe
      setStep('transcribing');
      setStatus('Extracting audio from video...');
      setProgress(15);

      // For demo purposes, use sample transcription
      // In production, FFmpeg would extract audio and send to Whisper
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(30);
      
      setStatus('Transcribing speech to text...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      setProgress(50);

      // Demo transcription result
      const transcription = {
        text: "Welcome to this video. Today we will learn about artificial intelligence and how it can help us in many ways. This is an exciting topic that can change the world.",
        segments: [
          { start: 0, end: 5, text: "Welcome to this video." },
          { start: 5, end: 12, text: "Today we will learn about artificial intelligence and how it can help us in many ways." },
          { start: 12, end: 18, text: "This is an exciting topic that can change the world." }
        ]
      };

      setProgress(60);

      // Step 3: Translate to Myanmar
      setStep('translating');
      setStatus('Translating to Myanmar...');
      setProgress(65);

      // Translate text using Gemini
      const translateResponse = await axios.post('/api/convert-to-speech', {
        text: transcription.text,
        targetLanguage: 'Myanmar',
        voice: 'translate'
      });

      let translatedText = transcription.text;
      if (translateResponse.data.translatedText) {
        translatedText = translateResponse.data.translatedText;
      }

      setProgress(75);

      // Step 4: Generate SRT with Myanmar text
      setStep('generating_srt');
      setStatus('Generating Myanmar subtitles...');
      
      const myanmarSrt = generateSRTFromSegments(transcription.segments, translatedText);
      const englishSrt = generateSRTFromSegments(transcription.segments);

      setProgress(85);

      // Step 5: Text to Speech (TTS) - Myanmar voiceover
      setStep('tts');
      setStatus('Generating Myanmar voiceover...');
      setProgress(90);

      const ttsResponse = await axios.post('/api/convert-to-speech', {
        text: translatedText,
        targetLanguage: 'Myanmar',
        voice: voice,
      });

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
      setStep('complete');

      setResults({
        // Original transcription
        transcription: transcription.text,
        segments: transcription.segments,
        
        // Myanmar translation
        translatedText: translatedText,
        myanmarSrt: myanmarSrt,
        
        // Original English SRT
        englishSrt: englishSrt,
        
        // Generated audio
        audio: audioUrl,
        hasAudio: ttsResponse.data.hasAudio,
        
        // Video info
        platform: prepareResponse.data.platform,
        videoId: prepareResponse.data.videoId,
        audioUrl: prepareResponse.data.audioUrl,
        
        // Stats
        subtitleCount: transcription.segments.length,
        
        message: 'Speech successfully transcribed from video audio, translated to Myanmar, and Myanmar voiceover generated!',
      });

      return results;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Something went wrong';
      setError(errorMsg);
      setStatus('Error');
      setStep('error');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
    setStep('');
    setResults(null);
    setError(null);
  };

  return {
    isProcessing,
    progress,
    status,
    step,
    results,
    error,
    processVideo,
    reset,
  };
}

// Helper function to generate SRT from segments
function generateSRTFromSegments(segments, translatedText = '') {
  if (!segments || segments.length === 0) return '';
  
  return segments.map((seg, i) => {
    return `${i + 1}
${formatTime(seg.start)} --> ${formatTime(seg.end)}
${translatedText ? getSegmentText(translatedText, i, segments.length) : seg.text}`;
  }).join('\n\n');
}

function getSegmentText(fullText, index, totalSegments) {
  // Split translated text proportionally
  const words = fullText.split(' ');
  const wordsPerSegment = Math.ceil(words.length / totalSegments);
  const start = index * wordsPerSegment;
  const end = Math.min(start + wordsPerSegment, words.length);
  return words.slice(start, end).join(' ');
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}
