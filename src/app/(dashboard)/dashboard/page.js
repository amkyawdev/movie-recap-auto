'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingAnimation, WaveProgress } from '@/components/shared/LoadingAnimation';
import { Download, Volume2, Languages, Mic, Link, Play, AlertCircle } from 'lucide-react';
import axios from 'axios';

// Client-side YouTube subtitle extractor
async function extractYouTubeSubtitles(videoId) {
  // Method 1: Try youtube-captions-scraper via dynamic import
  try {
    const scraperModule = await import('youtube-captions-scraper');
    const scraper = scraperModule.default || scraperModule;
    
    if (scraper.getSubtitles) {
      // Try English
      try {
        const subs = await scraper.getSubtitles({ videoID: videoId, lang: 'en' });
        if (subs && subs.length > 0) {
          return subs.map(sub => ({
            text: sub.text,
            start: sub.start,
            duration: sub.dur || 3,
          }));
        }
      } catch (e) {}
      
      // Try auto-generated
      try {
        const subs = await scraper.getSubtitles({ videoID: videoId, lang: 'a.en' });
        if (subs && subs.length > 0) {
          return subs.map(sub => ({
            text: sub.text,
            start: sub.start,
            duration: sub.dur || 3,
          }));
        }
      } catch (e) {}
    }
  } catch (e) {
    console.log('Scraper error:', e);
  }
  
  return null;
}

export default function DashboardPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const isYouTube = (url) => url.includes('youtube.com') || url.includes('youtu.be');
  const isTikTok = (url) => url.includes('tiktok.com');
  const isValidUrl = (url) => isYouTube(url) || isTikTok(url);

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : '';
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
    setStatus('Starting...');
    setError(null);

    try {
      let subtitles = [];
      let transcription = '';

      // Step 1: Extract subtitles
      setProgress(10);
      
      if (isYouTube(videoUrl)) {
        const videoId = extractVideoId(videoUrl);
        setStatus('Extracting YouTube subtitles...');
        
        // Client-side subtitle extraction
        const extractedSubs = await extractYouTubeSubtitles(videoId);
        
        if (extractedSubs && extractedSubs.length > 0) {
          subtitles = extractedSubs;
          transcription = subtitles.map(s => s.text).join(' ');
          setProgress(40);
          setStatus(`Found ${subtitles.length} subtitle segments!`);
        } else {
          setStatus('No subtitles found. Using speech-to-text...');
        }
      } else if (isTikTok(videoUrl)) {
        setStatus('Processing TikTok video...');
        // For TikTok, we need server-side download
        try {
          const downloadResponse = await axios.post('/api/tiktok-download', {
            url: videoUrl,
          });
          
          if (!downloadResponse.data.success) {
            throw new Error(downloadResponse.data.error || 'TikTok download failed');
          }
          
          setProgress(30);
        } catch (e) {
          throw new Error(`TikTok: ${e.response?.data?.error || e.message}`);
        }
      }

      // Step 2: If no subtitles, use Whisper
      if (!transcription) {
        setProgress(40);
        setStatus('Transcribing audio with AI...');
        
        const whisperResponse = await axios.post('/api/whisper', {
          url: videoUrl,
        });
        
        if (!whisperResponse.data.success) {
          throw new Error(whisperResponse.data.error || 'Transcription failed');
        }
        
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
      const segmentDuration = 5;
      const words = transcription.split(' ');
      const wordsPerSegment = 10;
      
      let englishSrt = [];
      let myanmarSrt = [];
      const translatedWords = translatedText.split(' ');
      
      for (let i = 0; i < words.length; i += wordsPerSegment) {
        const engWords = words.slice(i, i + wordsPerSegment).join(' ');
        const myaWords = translatedWords.slice(i, i + wordsPerSegment).join(' ');
        const idx = Math.floor(i / wordsPerSegment) + 1;
        const start = Math.floor(i / wordsPerSegment) * segmentDuration;
        const end = start + segmentDuration;
        
        englishSrt.push(`${idx}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${engWords}`);
        myanmarSrt.push(`${idx}\n${formatSrtTime(start)} --> ${formatSrtTime(end)}\n${myaWords}`);
      }

      setProgress(85);
      setStatus('Generating Myanmar MP3...');

      // Step 5: TTS
      let audioResultUrl = null;
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
          audioResultUrl = URL.createObjectURL(blob);
          hasAudio = true;
        }
      }

      setProgress(100);
      setStatus('Done!');

      setResults({
        videoUrl,
        platform: isYouTube(videoUrl) ? 'YouTube' : 'TikTok',
        transcription,
        translatedText,
        englishSrt: englishSrt.join('\n\n'),
        myanmarSrt: myanmarSrt.join('\n\n'),
        audio: audioResultUrl,
        hasAudio,
        subtitleCount: Math.ceil(words.length / wordsPerSegment),
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
      <p className="text-muted-foreground mb-6">YouTube/TikTok URL → Subtitles → Myanmar Translation → MP3</p>
      
      {!results ? (
        <Card>
          <CardHeader>
            <CardTitle>Enter Video URL</CardTitle>
            <CardDescription>
              Paste a YouTube or TikTok video link to extract subtitles and generate Myanmar voiceover
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
                  <CardDescription>
                    {results.platform} • {results.subtitleCount} segments
                  </CardDescription>
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

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <CardTitle>Original Transcription (English)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 whitespace-pre-wrap bg-muted p-4 rounded-lg max-h-48 overflow-auto">
                {results.transcription}
              </p>
              <Button variant="outline" size="sm" onClick={() => handleDownload('english')}>
                <Download className="mr-2 h-4 w-4" />
                Download English SRT
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Languages className="h-5 w-5 text-primary" />
                <CardTitle>Myanmar Translation (မြန်မာဘာသာပြန်)</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 whitespace-pre-wrap bg-muted p-4 rounded-lg max-h-48 overflow-auto">
                {results.translatedText}
              </p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-sm">
                {results.myanmarSrt}
              </pre>
              <Button className="mt-4" size="sm" onClick={() => handleDownload('myanmar')}>
                <Download className="mr-2 h-4 w-4" />
                Download Myanmar SRT
              </Button>
            </CardContent>
          </Card>

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
