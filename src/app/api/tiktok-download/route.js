import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'TikTok URL is required' },
        { status: 400 }
      );
    }

    const RAPIDAPI_KEY = process.env.TIKTOK_RAPIDAPI_KEY;
    
    if (!RAPIDAPI_KEY) {
      return NextResponse.json({
        success: false,
        error: 'TikTok download requires RAPIDAPI_KEY. Please add TIKTOK_RAPIDAPI_KEY to environment variables.'
      }, { status: 500 });
    }

    const response = await fetch('https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/index?url=' + encodeURIComponent(url), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Failed to download TikTok video. Please try again later.'
      }, { status: response.status });
    }

    const data = await response.json();
    let audioUrl = data.video || data.music || data.download_url || (Array.isArray(data) ? data[0] : null);

    if (!audioUrl) {
      return NextResponse.json({
        success: false,
        error: 'Could not extract audio from TikTok video'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      title: data.title || 'TikTok Video',
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
