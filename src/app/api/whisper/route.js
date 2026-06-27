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

    // Read audio file as base64
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    const audioBase64 = audioBuffer.toString('base64');

    // Check if OpenRouter API key is available for Whisper
    if (!process.env.OPENROUTER_API_KEY) {
      // Return mock transcription for demo
      return NextResponse.json({
        success: true,
        text: 'This is a demo transcription. In production, the actual audio would be transcribed using Whisper AI.',
        segments: [
          { start: 0, end: 5, text: 'This is a demo transcription.' },
          { start: 5, end: 12, text: 'In production, the actual audio would be transcribed using Whisper AI.' }
        ],
        language: 'en',
        duration: 12,
        message: 'Demo mode - add OPENROUTER_API_KEY for real transcription',
      });
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
          message: 'Transcription completed with Whisper',
        });
      }
    } catch (e) {
      console.log('Whisper API error:', e.message);
    }

    // Fallback: return error if API fails
    return NextResponse.json({
      success: false,
      error: 'Whisper transcription failed. Please try again.',
    }, { status: 500 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// For multipart form data, we need to handle it properly
export const config = {
  api: {
    bodyParser: false,
  },
};
