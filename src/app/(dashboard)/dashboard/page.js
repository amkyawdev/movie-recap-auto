'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingAnimation, WaveProgress } from '@/components/shared/LoadingAnimation';
import { Download, Volume2, Languages, Mic, Upload } from 'lucide-react';
import axios from 'axios';

export default function DashboardPage() {
  const [audioFile, setAudioFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleAudioUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setAudioFile(file);
    setIsProcessing(true);
    setProgress(0);
    setStatus('Processing audio file...');
    setError(null);

    try {
      // Step 1: Upload and transcribe with Whisper
      setProgress(10);
      setStatus('Uploading audio...');

      const formData = new FormData();
      formData.append('audio', file);

      setStatus('Transcribing audio with AI...');
      setProgress(20);

      const transcriptResponse = await axios.post('/api/whisper', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!transcriptResponse.data.success) {
        throw new Error(transcriptResponse.data.error || 'Transcription failed');
      }

      setProgress(40);
      setStatus('Translating to Myanmar...');

      // Step 2: Translate to Myanmar
      const translateResponse = await axios.post('/api/convert-to-speech', {
        text: transcriptResponse.data.text,
        targetLanguage: 'Myanmar',
        voice: 'translate'
      });

      const translatedText = translateResponse.data.translatedText || transcriptResponse.data.text;

      setProgress(60);
      setStatus('Generating Myanmar SRT...');

      // Step 3: Generate SRT files
      const segments = transcriptResponse.data.segments || [];
      
      const englishSrt = segments.map((seg, i) => 
        `${i + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}`
      ).join('\n\n');

      // For Myanmar SRT, we'll use the translated text
      const myanmarSrt = englishSrt; // Replace with translated segments if available

      setProgress(80);
      setStatus('Generating Myanmar voiceover...');

      // Step 4: TTS
      let audioUrl = null;
      let hasAudio = false;

      if (translatedText) {
        const ttsResponse = await axios.post('/api/convert-to-speech', {
          text: translatedText,
          targetLanguage: 'Myanmar',
          voice: 'alloy',
        });

        if (ttsResponse.data.hasAudio && ttsResponse.data.audio) {
          const response = await fetch(`data:audio/mp3;base64,${ttsResponse.data.audio}`);
          const blob = await response.blob();
          audioUrl = URL.createObjectURL(blob);
          hasAudio = true;
        }
      }

      setProgress(100);
      setStatus('Done!');

      setResults({
        transcription: transcriptResponse.data.text,
        translatedText: translatedText,
        englishSrt: englishSrt,
        myanmarSrt: myanmarSrt,
        audio: audioUrl,
        hasAudio,
        subtitleCount: segments.length,
        message: 'Audio successfully transcribed and processed!',
      });

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (type) => {
    const content = type === 'myanmar' ? results.myanmarSrt : results.englishSrt;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'myanmar' ? 'myanmar-subtitles.srt' : 'english-subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  const handleReset = () => {
    setAudioFile(null);
    setResults(null);
    setError(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Movie Recap Auto</h1>
      <p className="text-muted-foreground mb-6">Upload audio → Speech to Text → Myanmar Translation → Myanmar Voiceover</p>
      
      {!results ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Audio File</CardTitle>
            <CardDescription>
              Upload an audio file to transcribe, translate to Myanmar, and generate voiceover
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="border-2 border-dashed border-purple-300 dark:border-purple-700 rounded-lg p-12 text-center cursor-pointer hover:border-purple-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.flac"
                onChange={handleAudioUpload}
                className="hidden"
              />
              <Upload className="h-16 w-16 mx-auto text-purple-400 mb-4" />
              <p className="text-xl font-medium">Click to upload audio file</p>
              <p className="text-sm text-muted-foreground mt-2">MP3, WAV, M4A, OGG, FLAC supported</p>
              {audioFile && (
                <p className="mt-4 text-purple-600 font-medium">{audioFile.name}</p>
              )}
            </div>

            {isProcessing && (
              <div className="mt-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mic className="h-5 w-5 text-purple-600 animate-pulse" />
                  <span className="font-medium text-purple-600">{status}</span>
                </div>
                <LoadingAnimation message="" />
                <div className="mt-6">
                  <WaveProgress progress={progress} status="" />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Processing Complete!</CardTitle>
                  <CardDescription>{results.subtitleCount} segments • Audio transcribed successfully</CardDescription>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Process New Audio
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-purple-600" />
                <CardTitle>Original Transcription</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 whitespace-pre-wrap">{results.transcription}</p>
              <Button variant="outline" size="sm" onClick={() => handleDownload('english')}>
                <Download className="mr-2 h-4 w-4" />
                Download English SRT
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-purple-600" />
                <CardTitle>Myanmar Translation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 font-myanmar whitespace-pre-wrap">{results.translatedText}</p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-sm font-myanmar">
                {results.myanmarSrt}
              </pre>
              <Button className="mt-4" size="sm" onClick={() => handleDownload('myanmar')}>
                <Download className="mr-2 h-4 w-4" />
                Download Myanmar SRT
              </Button>
            </CardContent>
          </Card>

          {results.hasAudio && results.audio && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-purple-600" />
                  <CardTitle>Myanmar Voiceover</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 dark:bg-purple-950/30 p-6 rounded-lg">
                  <audio controls className="w-full" src={results.audio}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
