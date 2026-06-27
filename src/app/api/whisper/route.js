import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Check if OpenRouter API key is available
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OPENROUTER_API_KEY not configured. Please set up your API key in Vercel Environment Variables.',
      }, { status: 500 });
    }

    // Use OpenRouter's Whisper API for transcription
    try {
      const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          text: data.text || '',
          language: data.language || 'en',
          segments: data.segments || [],
          message: 'Transcription completed',
        });
      } else {
        const errorData = await response.json();
        return NextResponse.json({
          success: false,
          error: errorData.error?.message || 'Whisper transcription failed',
        }, { status: response.status });
      }
    } catch (e) {
      console.log('Whisper API error:', e.message);
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to transcription service',
      }, { status: 500 });
    }

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
