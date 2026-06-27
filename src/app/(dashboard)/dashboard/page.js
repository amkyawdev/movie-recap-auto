'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useVideoProcessor } from '@/hooks/useVideoProcessor';
import { LoadingAnimation, WaveProgress } from '@/components/shared/LoadingAnimation';
import { Link2, Play, Download, Volume2, Languages, Mic, FileText } from 'lucide-react';

export default function DashboardPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const { isProcessing, progress, status, step, results, error, processVideo, reset } = useVideoProcessor();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoUrl) return;
    await processVideo(videoUrl, { targetLanguage: 'Myanmar' });
  };

  const handleDownloadSRT = (type) => {
    const content = type === 'myanmar' ? results.myanmarSrt : results.englishSrt;
    if (!content) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = type === 'myanmar' ? 'subtitles-myanmar.srt' : 'subtitles-english.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepLabel = () => {
    const steps = {
      preparing: '1. Preparing',
      transcribing: '2. Speech to Text',
      translating: '3. Translating to Myanmar',
      generating_srt: '4. Generating SRT',
      tts: '5. Myanmar Voiceover',
      complete: 'Complete!',
      error: 'Error',
    };
    return steps[step] || status;
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Movie Recap Auto</h1>
      <p className="text-muted-foreground mb-6">Speech to Text → Myanmar Translation → Myanmar Voiceover</p>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Process Video</CardTitle>
          <CardDescription>Enter a YouTube URL to extract speech, translate to Myanmar, and generate Myanmar voiceover</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="pl-10"
                  disabled={isProcessing}
                />
              </div>
              <Button type="submit" disabled={isProcessing || !videoUrl}>
                <Play className="mr-2 h-4 w-4" />
                Process
              </Button>
            </div>

            {isProcessing && (
              <div className="py-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Mic className="h-5 w-5 text-purple-600" />
                  <span className="font-medium text-purple-600">{getStepLabel()}</span>
                </div>
                <LoadingAnimation message={status} />
                <div className="mt-6">
                  <WaveProgress progress={progress} status="" />
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Results Summary */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Processing Complete!</CardTitle>
                  <CardDescription>{results.subtitleCount} segments processed</CardDescription>
                </div>
                <Button variant="outline" onClick={reset}>
                  New Video
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{results.message}</p>
            </CardContent>
          </Card>

          {/* Video Preview */}
          {results.videoId && results.platform === 'youtube' && (
            <Card>
              <CardHeader>
                <CardTitle>Video</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.youtube.com/embed/${results.videoId}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Original Transcription */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Mic className="h-5 w-5 text-purple-600" />
                  <CardTitle>Original Speech (English)</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{results.transcription}</p>
              <Button variant="outline" size="sm" onClick={() => handleDownloadSRT('english')}>
                <Download className="mr-2 h-4 w-4" />
                Download English SRT
              </Button>
            </CardContent>
          </Card>

          {/* Myanmar Translation */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-purple-600" />
                  <CardTitle>Myanmar Translation</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDownloadSRT('myanmar')}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Myanmar SRT
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4 font-myanmar">{results.translatedText}</p>
              <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64 text-sm font-myanmar">
                {results.myanmarSrt}
              </pre>
            </CardContent>
          </Card>

          {/* Myanmar Voiceover */}
          {results.hasAudio && results.audio && (
            <Card className="border-purple-200 dark:border-purple-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-purple-600" />
                  <CardTitle>Myanmar Voiceover</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                  <audio controls className="w-full">
                    <source src={results.audio} type="audio/mpeg" />
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
