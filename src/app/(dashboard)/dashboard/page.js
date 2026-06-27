'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useVideoProcessor } from '@/hooks/useVideoProcessor';
import { LoadingAnimation, WaveProgress } from '@/components/shared/LoadingAnimation';
import { Link2, Play, Download, Volume2, Languages } from 'lucide-react';

export default function DashboardPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const { isProcessing, progress, status, results, error, processVideo, reset } = useVideoProcessor();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoUrl) return;
    await processVideo(videoUrl, { translate: true, targetLanguage: 'Myanmar' });
  };

  const handleDownloadSRT = () => {
    if (!results?.srt) return;
    const blob = new Blob([results.srt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitles.srt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Process Video</CardTitle>
          <CardDescription>Enter a YouTube URL to extract subtitles and generate Myanmar voiceover</CardDescription>
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {results.subtitleCount} subtitles extracted from {results.platform}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleDownloadSRT}>
                  <Download className="mr-2 h-4 w-4" />
                  Download SRT
                </Button>
                <Button variant="outline" size="sm" onClick={reset}>
                  New Video
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Video Preview */}
              {results.videoId && results.platform === 'youtube' && (
                <div className="aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <iframe
                    src={`https://www.youtube.com/embed/${results.videoId}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Audio Player */}
              {results.hasAudio && results.audio && (
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Volume2 className="h-5 w-5 text-purple-600" />
                    <span className="font-medium text-purple-600 dark:text-purple-400">Generated Voiceover</span>
                  </div>
                  <audio controls className="w-full">
                    <source src={results.audio} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Subtitle Preview */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Languages className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Subtitles (Myanmar)</span>
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                  {results.srt}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
