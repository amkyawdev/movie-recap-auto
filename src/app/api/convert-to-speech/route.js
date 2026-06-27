import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { srtContent, text, voice = 'alloy', targetLanguage = 'Myanmar' } = await request.json();

    if (!srtContent && !text) {
      return NextResponse.json(
        { success: false, error: 'SRT content or text is required' },
        { status: 400 }
      );
    }

    // Extract text from SRT if SRT content is provided
    let textToSpeak = text || '';
    
    if (srtContent) {
      const lines = srtContent.split('\n');
      for (const line of lines) {
        // Skip empty lines, numbers, and time codes
        if (line.trim() && !/^\d+$/.test(line.trim()) && !line.includes('-->')) {
          textToSpeak += line.trim() + ' ';
        }
      }
      textToSpeak = textToSpeak.trim();
    }

    // Generate speech using OpenRouter TTS
    let audioBase64 = '';
    let ttsSuccess = false;

    if (process.env.OPENROUTER_API_KEY && textToSpeak) {
      try {
        // Use OpenRouter's audio/speech endpoint with Google TTS
        const response = await fetch('https://openrouter.ai/api/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Movie Recap Auto',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-exp',
            input: textToSpeak,
            voice: mapGoogleVoice(voice, targetLanguage),
          })
        });

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          audioBase64 = Buffer.from(buffer).toString('base64');
          ttsSuccess = true;
        } else {
          // Fallback to OpenAI TTS if Google TTS fails
          const fallbackResponse = await fetch('https://openrouter.ai/api/v1/audio/speech', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'openai/tts-1',
              input: textToSpeak,
              voice: mapVoice(voice),
            })
          });

          if (fallbackResponse.ok) {
            const buffer = await fallbackResponse.arrayBuffer();
            audioBase64 = Buffer.from(buffer).toString('base64');
            ttsSuccess = true;
          }
        }
      } catch (e) {
        console.log('TTS generation failed:', e.message);
      }
    }

    return NextResponse.json({
      success: true,
      audio: audioBase64,
      hasAudio: ttsSuccess,
      text: textToSpeak,
      voice,
      message: ttsSuccess ? 'TTS generated successfully' : 'TTS not available - add OPENROUTER_API_KEY',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Map voice names to OpenAI TTS voice names
function mapVoice(voice) {
  const voiceMap = {
    'alloy': 'alloy',
    'echo': 'echo',
    'fable': 'fable',
    'onyx': 'onyx',
    'nova': 'nova',
    'shimmer': 'shimmer',
    // Default to alloy if unknown
  };
  return voiceMap[voice?.toLowerCase()] || 'alloy';
}

// Map voice for Google TTS
function mapGoogleVoice(voice, targetLanguage) {
  // Google TTS voices based on language
  const googleVoices = {
    'myanmar': {
      'male': 'my-MM-Standard-A',
      'female': 'my-MM-Standard-A',
    },
    'english': {
      'male': 'en-US-Neural2-J',
      'female': 'en-US-Neural2-F',
    },
    'default': {
      'male': 'en-US-Neural2-J',
      'female': 'en-US-Neural2-F',
    }
  };
  
  // Map input voice to gender
  const maleVoices = ['echo', 'onyx', 'fable'];
  const gender = maleVoices.includes(voice?.toLowerCase()) ? 'male' : 'female';
  
  // Get language key
  let langKey = 'default';
  if (targetLanguage?.toLowerCase().includes('myanmar') || targetLanguage?.toLowerCase().includes('burmese')) {
    langKey = 'myanmar';
  } else if (targetLanguage?.toLowerCase().includes('english')) {
    langKey = 'english';
  }
  
  return googleVoices[langKey][gender] || googleVoices.default.female;
}
