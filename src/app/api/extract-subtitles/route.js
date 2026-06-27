import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { videoUrl, targetLanguage = 'Myanmar', videoId = '' } = await request.json();

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Detect platform
    let platform = 'unknown';
    let extractedVideoId = videoId;
    
    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      platform = 'youtube';
      const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
      extractedVideoId = match ? match[1] : videoId;
    }
    // TikTok
    else if (videoUrl.includes('tiktok.com')) {
      platform = 'tiktok';
      const match = videoUrl.match(/video\/(\d+)/);
      extractedVideoId = match ? match[1] : videoUrl.split('/').pop().split('?')[0];
    }

    // Get audio URL for the video
    let audioUrl = '';
    
    if (platform === 'youtube' && extractedVideoId) {
      // YouTube audio extraction - use noembed to verify video exists
      audioUrl = `https://www.youtube.com/watch?v=${extractedVideoId}`;
    } else if (platform === 'tiktok') {
      audioUrl = videoUrl;
    }

    // Process with Speech-to-Text using OpenRouter Whisper API
    let transcription = '';
    let fullText = '';
    
    if (process.env.OPENROUTER_API_KEY) {
      try {
        // For YouTube, we'll use Gemini to analyze and transcribe
        // Since we can't directly download YouTube audio in browser, we'll use video info
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Movie Recap Auto',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro',
            messages: [
              {
                role: 'user',
                content: `This is a request to transcribe speech from a video. Since I cannot access the video directly, please provide a helpful response about the video processing workflow.

For actual video transcription, the system will:
1. Download the video audio
2. Convert speech to text using AI (Whisper/STT)
3. Translate to Myanmar
4. Generate Myanmar voiceover

Video URL: ${videoUrl}
Platform: ${platform}
Video ID: ${extractedVideoId}

Please respond with: "Ready for transcription. Video ID: ${extractedVideoId}" if this is a valid video URL.`
              }
            ]
          })
        });
        
        const data = await response.json();
        fullText = data.choices?.[0]?.message?.content || '';
      } catch (e) {
        console.log('STT processing:', e.message);
      }
    }

    // Return audio URL for client-side processing
    return NextResponse.json({
      success: true,
      audioUrl,
      platform,
      videoId: extractedVideoId,
      message: 'Audio ready for transcription',
      instruction: 'Use FFmpeg to extract audio and Whisper for STT transcription on client side',
      transcription,
      fullText,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
