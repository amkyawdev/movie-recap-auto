'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingAnimation, WaveProgress } from '@/components/shared/LoadingAnimation';
import { Download, Volume2, Languages, Mic, Link, Play, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function DashboardPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const isValidUrl = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('tiktok.com');
  };

  const handleProcessVideo = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a YouTube or TikTok URL');
      return;
    }
    
    if (!isValidUrl(videoUrl)) {
      setError('Please enter a valid YouTube or TikTok URL');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStatus('Starting video processing...');
    setError(null);

    try {
      // Step 1: Extract subtitles from video URL
      setProgress(10);
      setStatus('Extracting subtitles from video...');

      const subtitleResponse = await axios.post('/api/extract-subtitles', {
        url: videoUrl,
      });

      if (!subtitleResponse.data.success) {
        throw new Error(subtitleResponse.data.error || 'Subtitle extraction failed');
      }

      const { subtitles, originalLanguage } = subtitleResponse.data;
      setProgress(40);
      setStatus('Transcribing to text...');

      // Step 2: Transcribe (if no subtitles available, use Whisper)
      let transcription = subtitles.map(s => s.text).join(' ');
      
      if (!subtitles || subtitles.length === 0) {
        setStatus('No subtitles found. Using speech-to-text...');
        const whisperResponse = await axios.post('/api/whisper', {
          url: videoUrl,
        });
        transcription = whisperResponse.data.text;
      }

      setProgress(60);
      setStatus('Translating to Myanmar...');

      // Step 3: Translate to Myanmar
      const translateResponse = await axios.post('/api/convert-to-speech', {
        text: transcription,
        targetLanguage: 'Myanmar',
        voice: 'translate'
      });

      const translatedText = translateResponse.data.translatedText || transcription;

      setProgress(75);
      setStatus('Generating Myanmar SRT...');

      // Step 4: Generate SRT files
      let englishSrt = '';
      let myanmarSrt = '';
      
      if (subtitles && subtitles.length > 0) {
        englishSrt = subtitles.map((sub, i) => {
          const startTime = formatSrtTime(sub.start || i * 3);
          const endTime = formatSrtTime(sub.start + (sub.duration || 3));
          return `${i + 1}\n${startTime} --> ${endTime}\n${sub.text}`;
        }).join('\n\n');

        // Generate Myanmar SRT with same timing
        const translatedSegments = translatedText.split(/[.!?]+/).filter(s => s.trim());
        myanmarSrt = subtitles.map((sub, i) => {
          const startTime = formatSrtTime(sub.start || i * 3);
          const endTime = formatSrtTime(sub.start + (sub.duration || 3));
          const translatedTextForSub = translatedSegments[i] || sub.text;
          return `${i + 1}\n${startTime} --> ${endTime}\n${translatedTextForSub.trim()}`;
        }).join('\n\n');
      } else {
        // Create SRT from transcription
        const words = transcription.split(' ');
        const segmentDuration = 5; // 5 seconds per segment
        englishSrt = words.reduce((acc, word, i) => {
          const segmentIndex = Math.floor(i / 10);
          const startTime = formatSrtTime(segmentIndex * segmentDuration);
          const endTime = formatSrtTime((segmentIndex + 1) * segmentDuration);
          if (!acc[segmentIndex]) acc[segmentIndex] = [];
          acc[segmentIndex].push(word);
          return acc;
        }, []).map((words, i) => `${i + 1}\n${formatSrtTime(i * segmentDuration)} --> ${formatSrtTime((i + 1) * segmentDuration)}\n${words.join(' ')}`).join('\n\n');

        const myanmarWords = translatedText.split(' ');
        myanmarSrt = myanmarWords.reduce((acc, word, i) => {
          const segmentIndex = Math.floor(i / 10);
          if (!acc[segmentIndex]) acc[segmentIndex] = [];
          acc[segmentIndex].push(word);
          return acc;
        }, []).map((words, i) => `${i + 1}\n${formatSrtTime(i * segmentDuration)} --> ${formatSrtTime((i + 1) * segmentDuration)}\n${words.join(' ')}`).join('\n\n');
      }

      setProgress(85);
      setStatus('Generating Myanmar voiceover MP3...');

      // Step 5: TTS - Generate MP3
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
        videoUrl,
        transcription,
        translatedText,
        englishSrt,
        myanmarSrt,
        audio: audioUrl,
        hasAudio,
        subtitleCount: subtitles?.length || 0,
        message: 'Video processed successfully!',
      });

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (type) => {
    let content, filename;
    
    if (type === 'myanmar') {
      content = results.myanmarSrt;
      filename = 'myanmar-subtitles.srt';
    } else if (type === 'english') {
      content = results.englishSrt;
      filename = 'english-subtitles.srt';
    } else if (type === 'mp3') {
      // Download MP3
      if (results.audio) {
        const a = document.createElement('a');
        a.href = results.audio;
        a.download = 'myanmar-voiceover.mp3';
        a.click();
        return;
      }
      return;
    }
    
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatSrtTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  const handleReset = () => {
    setVideoUrl('');
    setResults(null);
    setError(null);
    setProgress(0);
    setStatus('');
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-2">Movie Recap Auto</h1>
      <p className="text-muted-foreground mb-6">YouTube/TikTok URL → Speech to Text → Myanmar Translation → Myanmar MP3 Voiceover</p>
      
      {!results ? (
        <Card>
          <CardHeader>
            <CardTitle>Enter Video URL</CardTitle>
            <CardDescription>
              Paste a YouTube or TikTok video link to extract subtitles, translate to Myanmar, and generate MP3 voiceover
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://www.tiktok.com/..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="pl-10"
                    disabled={isProcessing}
                  />
                </div>
                <Button 
                  onClick={handleProcessVideo} 
                  disabled={isProcessing || !videoUrl.trim()}
                  className="gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Process
                    </>
                  )}
                </Button>
              </div>

              {/* Platform Icons */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="text-red-500">●</span> YouTube
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-black">●</span> TikTok
                </span>
              </div>
            </div>

            {isProcessing && (
              <div className="mt-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mic className="h-5 w-5 text-primary animate-pulse" />
                  <span className="font-medium">{status}</span>
                </div>
                <LoadingAnimation message="" />
                <div className="mt-6">
                  <WaveProgress progress={progress} status="" />
                </div>
              </div>
            )}

            {error && (
              <div className="mt-6 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <CardTitle>Processing Complete! 🎉</CardTitle>
                  <CardDescription>{results.subtitleCount} subtitle segments extracted</CardDescription>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Process New Video
                </Button>
              </div>
            </CardHeader>
            {results.videoUrl && (
              <CardContent>
                <p className="text-sm text-muted-foreground">Source: {results.videoUrl}</p>
              </CardContent>
            )}
          </Card>

          {/* Original Transcription */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <CardTitle>Original Transcription</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 whitespace-pre-wrap bg-muted p-4 rounded-lg">{results.transcription}</p>
              <Button variant="outline" size="sm" onClick={() => handleDownload('english')}>
                <Download className="mr-2 h-4 w-4" />
                Download English SRT
              </Button>
            </CardContent>
          </Card>

          {/* Myanmar Translation */}
          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                <CardTitle>Myanmar Translation (မြန်မာဘာသာပြန်)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 whitespace-pre-wrap bg-muted p-4 rounded-lg">{results.translatedText}</p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-sm">
                {results.myanmarSrt}
              </pre>
              <Button className="mt-4" size="sm" onClick={() => handleDownload('myanmar')}>
                <Download className="mr-2 h-4 w-4" />
                Download Myanmar SRT
              </Button>
            </CardContent>
          </Card>

          {/* Myanmar Voiceover MP3 */}
          {results.hasAudio && results.audio && (
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <CardTitle>Myanmar Voiceover MP3 (မြန်မာစကားပြော)</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-muted p-6 rounded-lg">
                  <audio controls className="w-full" src={results.audio}>
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <Button className="mt-4" onClick={() => handleDownload('mp3')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download MP3
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
