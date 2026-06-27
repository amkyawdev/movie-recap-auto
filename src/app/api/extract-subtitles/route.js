import { NextResponse } from 'next/server';

// Dynamic import to handle ES modules
async function getYouTubeCaptions() {
  try {
    const module = await import('youtube-captions-scraper');
    return module.default || module;
  } catch (e) {
    return null;
  }
}

export async function POST(request) {
  try {
    const { videoUrl, targetLanguage = 'Myanmar' } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Detect platform
    let platform = 'unknown';
    let extractedVideoId = '';
    
    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      platform = 'youtube';
      const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
      extractedVideoId = match ? match[1] : '';
    }
    // TikTok
    else if (videoUrl.includes('tiktok.com')) {
      platform = 'tiktok';
      const match = videoUrl.match(/video\/(\d+)/);
      extractedVideoId = match ? match[1] : videoUrl.split('/').pop().split('?')[0];
    }

    if (platform === 'unknown') {
      return NextResponse.json({
        success: false,
        error: 'Unsupported video URL. Please use YouTube or TikTok URL.',
      });
    }

    // Extract subtitles for YouTube
    if (platform === 'youtube' && extractedVideoId) {
      try {
        const scraper = await getYouTubeCaptions();
        
        if (scraper && scraper.getSubtitles) {
          // Try to get English subtitles first
          let subtitles = [];
          try {
            const englishSubs = await scraper.getSubtitles({
              videoID: extractedVideoId,
              lang: 'en'
            });
            subtitles = englishSubs;
          } catch (e) {
            // Try auto-generated subtitles
            try {
              const autoSubs = await scraper.getSubtitles({
                videoID: extractedVideoId,
                lang: 'a.en'
              });
              subtitles = autoSubs;
            } catch (e2) {
              // No subtitles available
            }
          }

          if (subtitles && subtitles.length > 0) {
            return NextResponse.json({
              success: true,
              platform,
              videoId: extractedVideoId,
              subtitles: subtitles.map(sub => ({
                text: sub.text,
                start: sub.start,
                duration: sub.dur || 3,
              })),
              originalLanguage: 'en',
              message: 'Subtitles extracted successfully',
            });
          }
        }
      } catch (e) {
        console.log('YouTube caption extraction error:', e.message);
      }
    }

    // If no subtitles found or TikTok, return empty subtitles array
    // The dashboard will use Whisper for speech-to-text instead
    return NextResponse.json({
      success: true,
      platform,
      videoId: extractedVideoId,
      subtitles: [],
      message: 'No subtitles available. Will use speech-to-text instead.',
      useSpeechToText: true,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
