import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'YouTube URL is required' },
        { status: 400 }
      );
    }

    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    
    if (!videoIdMatch) {
      return NextResponse.json({
        success: false,
        error: 'Invalid YouTube URL'
      }, { status: 400 });
    }

    const videoId = videoIdMatch[1];

    const invidiousInstances = [
      'https://yewtu.be',
      'https://invidious.privacyredirect.com',
      'https://vid.puffyan.us'
    ];

    for (const instance of invidiousInstances) {
      try {
        const apiUrl = `${instance}/api/v1/videos/${videoId}`;
        const response = await fetch(apiUrl, { timeout: 10000 });
        
        if (response.ok) {
          const data = await response.json();
          
          const audioStreams = data.adaptiveFormats?.filter(f => f.type.startsWith('audio/')) || [];
          
          if (audioStreams.length > 0) {
            audioStreams.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            const audioUrl = audioStreams[0].url;
            
            return NextResponse.json({
              success: true,
              audioUrl,
              videoId,
              title: data.title || 'YouTube Video',
              message: 'Audio extracted successfully'
            });
          }
        }
      } catch (e) {
        console.log(`Invidious ${instance} error:`, e.message);
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Could not extract audio. Try a video with subtitles or use TikTok.',
      videoId,
    }, { status: 500 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
