import { NextResponse } from 'next/server';

// Dynamic import for ES modules
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
    const { url, targetLanguage = 'Myanmar' } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Extract video ID
    let videoId = '';
    let platform = 'unknown';
    
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
      const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
      videoId = match ? match[1] : '';
    }
    // TikTok
    else if (url.includes('tiktok.com')) {
      platform = 'tiktok';
      const match = url.match(/video\/(\d+)/);
      videoId = match ? match[1] : url.split('/').pop().split('?')[0];
    }

    if (platform === 'unknown' || !videoId) {
      return NextResponse.json({
        success: false,
        error: 'Unsupported video URL. Please use YouTube or TikTok URL.',
      });
    }

    // For YouTube - try to get subtitles/transcript
    if (platform === 'youtube' && videoId) {
      const subtitles = await getYouTubeSubtitles(videoId);
      
      if (subtitles && subtitles.length > 0) {
        return NextResponse.json({
          success: true,
          platform,
          videoId,
          subtitles,
          originalLanguage: 'en',
          message: 'Subtitles extracted successfully',
        });
      }
    }

    // For TikTok - use RapidAPI
    if (platform === 'tiktok') {
      const RAPIDAPI_KEY = process.env.TIKTOK_RAPIDAPI_KEY;
      
      if (RAPIDAPI_KEY) {
        try {
          const response = await fetch(
            'https://tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com/index?url=' + encodeURIComponent(url),
            {
              method: 'GET',
              headers: {
                'X-RapidAPI-Key': RAPIDAPI_KEY,
                'X-RapidAPI-Host': 'tiktok-downloader-download-tiktok-videos-without-watermark.p.rapidapi.com'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            const audioUrl = data.video || data.music || data.download_url || (Array.isArray(data) ? data[0] : null);
            
            if (audioUrl) {
              return NextResponse.json({
                success: true,
                platform,
                videoId,
                audioUrl,
                message: 'TikTok audio ready for transcription',
              });
            }
          }
        } catch (e) {
          console.log('TikTok API error:', e.message);
        }
      }
      
      return NextResponse.json({
        success: false,
        error: 'TikTok requires RAPIDAPI_KEY. Please add TIKTOK_RAPIDAPI_KEY to environment variables.',
        platform,
        videoId,
      }, { status: 500 });
    }

    // No subtitles found - return for Whisper processing
    return NextResponse.json({
      success: false,
      error: 'No subtitles available. Please use a video with captions or add RAPIDAPI_KEY for TikTok.',
      platform,
      videoId,
      subtitles: [],
    }, { status: 404 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get YouTube subtitles using multiple methods
async function getYouTubeSubtitles(videoId) {
  // Method 1: Try youtube-captions-scraper
  try {
    const scraper = await getYouTubeCaptions();
    
    if (scraper && scraper.getSubtitles) {
      // Try English subtitles
      try {
        const subs = await scraper.getSubtitles({
          videoID: videoId,
          lang: 'en'
        });
        if (subs && subs.length > 0) {
          return subs.map(sub => ({
            text: sub.text,
            start: sub.start,
            duration: sub.dur || 3,
          }));
        }
      } catch (e) {}
      
      // Try auto-generated subtitles
      try {
        const subs = await scraper.getSubtitles({
          videoID: videoId,
          lang: 'a.en'
        });
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
    console.log('Scraper error:', e.message);
  }

  // Method 2: Try direct YouTube transcript API
  try {
    const transcriptUrl = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en`;
    const response = await fetch(transcriptUrl, { timeout: 5000 });
    
    if (response.ok) {
      const text = await response.text();
      
      if (text && text.includes('<text')) {
        // Parse XML format subtitles
        const subtitles = [];
        const regex = /<text[^>]*start="([\d.]+)"[^>]*dur="([\d.]+)"[^>]*>([^<]+)<\/text>/g;
        let match;
        
        while ((match = regex.exec(text)) !== null) {
          subtitles.push({
            start: parseFloat(match[1]),
            duration: parseFloat(match[2]),
            text: decodeHtmlEntities(match[3]),
          });
        }
        
        if (subtitles.length > 0) {
          return subtitles;
        }
      }
    }
  } catch (e) {
    console.log('Direct transcript error:', e.message);
  }

  return null;
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
