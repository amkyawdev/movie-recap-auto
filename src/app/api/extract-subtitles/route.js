import { NextResponse } from 'next/server';

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

    // Return success - we don't need captions/subtitles
    // STT will transcribe from the video audio
    return NextResponse.json({
      success: true,
      platform,
      videoId: extractedVideoId,
      message: 'Video URL valid - ready for Speech-to-Text processing',
      instruction: 'The system will extract audio from the video and use AI to transcribe the speech',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
