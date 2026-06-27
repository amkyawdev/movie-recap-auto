'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useVideoProcessor } from '@/hooks/useVideoProcessor';
import { Link2, Play, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const { isProcessing, progress, status, results, error, processVideo } = useVideoProcessor();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!videoUrl) return;
    await processVideo(videoUrl);
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Process Video</CardTitle>
          <CardDescription>Enter a YouTube or TikTok URL to extract subtitles and generate voiceover</CardDescription>
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
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Process
                  </>
                )}
              </Button>
            </div>

            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{status}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                {error}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Results</CardTitle>
            <CardDescription>
              {results.subtitleCount} subtitles extracted from {results.platform}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-64">
              {results.srt}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
