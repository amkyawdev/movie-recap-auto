import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { videoUrl, platform, videoId } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      );
    }

    let audioUrl = '';
    let audioFormat = '';

    if (platform === 'youtube' && videoId) {
      audioUrl = `https://youtube.com/watch?v=${videoId}`;
      audioFormat = 'youtube';
    } else if (platform === 'tiktok') {
      audioUrl = videoUrl;
      audioFormat = 'tiktok';
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      platform,
      videoId,
      audioFormat,
      message: 'Video audio URL prepared for client-side extraction',
      instruction: 'Use FFmpeg on client to extract audio, then use Speech-to-Text API',
      whisperEndpoint: '/api/whisper',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
