import { NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request) {
  try {
    // Check if it's a JSON request with video URL
    const jsonData = await request.json().catch(() => null);
    
    if (jsonData?.url) {
      // Handle video URL - download audio and transcribe
      return await handleVideoUrl(jsonData.url);
    }

    // Handle file upload
    const formData = await request.formData();
    const audioFile = formData.get('audio');
    
    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'Audio file or video URL is required' },
        { status: 400 }
      );
    }

    return await handleAudioFile(audioFile);

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleVideoUrl(videoUrl) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'OPENROUTER_API_KEY not configured. Please set up your API key.',
    }, { status: 500 });
  }

  const tempDir = '/tmp/audio';
  const outputPath = join(tempDir, `audio_${Date.now()}.mp3`);
  
  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });

    // Detect platform
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isTikTok = videoUrl.includes('tiktok.com');

    let downloadCmd;
    if (isYouTube) {
      // Use yt-dlp for YouTube
      downloadCmd = `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${videoUrl}" 2>&1`;
    } else if (isTikTok) {
      // Use yt-dlp for TikTok
      downloadCmd = `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${videoUrl}" 2>&1`;
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unsupported video URL',
      }, { status: 400 });
    }

    // Download audio
    await new Promise((resolve, reject) => {
      const process = spawn('bash', ['-c', downloadCmd]);
      let stderr = '';
      process.stderr.on('data', (data) => { stderr += data.toString(); });
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Download failed: ${stderr}`));
        } else {
          resolve();
        }
      });
    });

    // Read the downloaded audio file
    const fs = require('fs');
    const audioBuffer = fs.readFileSync(outputPath);
    
    // Transcribe using OpenRouter Whisper API
    const formData = new FormData();
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    formData.append('audio', blob, 'audio.mp3');
    formData.append('model', 'openai/whisper-large-v3');

    const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      },
      body: formData,
    });

    // Clean up temp file
    try { await unlink(outputPath); } catch (e) {}

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        text: data.text || '',
        language: data.language || 'en',
        segments: data.segments || [],
        message: 'Transcription completed from video',
      });
    } else {
      const errorData = await response.json();
      return NextResponse.json({
        success: false,
        error: errorData.error?.message || 'Transcription failed',
      }, { status: response.status });
    }

  } catch (error) {
    // Clean up temp file on error
    try { await unlink(outputPath); } catch (e) {}
    
    return NextResponse.json({
      success: false,
      error: `Failed to process video: ${error.message}`,
    }, { status: 500 });
  }
}

async function handleAudioFile(audioFile) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json({
      success: false,
      error: 'OPENROUTER_API_KEY not configured. Please set up your API key.',
    }, { status: 500 });
  }

  try {
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('model', 'openai/whisper-large-v3');

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
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to transcription service',
    }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
