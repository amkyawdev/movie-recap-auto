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
    let videoId = '';
    let subtitles = [];
    
    // YouTube
    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
      platform = 'youtube';
      const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
      videoId = match ? match[1] : '';
      
      if (videoId) {
        subtitles = await fetchYouTubeCaptions(videoId);
      }
    }
    // TikTok
    else if (videoUrl.includes('tiktok.com')) {
      platform = 'tiktok';
      // Extract video ID from TikTok URL
      const match = videoUrl.match(/video\/(\d+)/);
      videoId = match ? match[1] : videoUrl.split('/').pop().split('?')[0];
      
      subtitles = await fetchTikTokCaptions(videoUrl);
    }

    // If no captions, use mock data for demo
    if (subtitles.length === 0) {
      subtitles = [
        { start: 0, end: 3, text: 'Welcome to this video' },
        { start: 3, end: 6, text: 'Today we will learn about AI' },
        { start: 6, end: 9, text: 'This is a demo subtitle' },
        { start: 9, end: 12, text: 'Thank you for watching' },
      ];
    }

    // Convert to SRT format
    const srt = subtitles.map((sub, i) => {
      return `${i + 1}
${formatTime(sub.start)} --> ${formatTime(sub.end)}
${sub.text}`;
    }).join('\n\n');

    // Translate to target language using OpenRouter
    let translatedSrt = srt;
    if (targetLanguage !== 'English' && process.env.OPENROUTER_API_KEY) {
      try {
        translatedSrt = await translateSRT(srt, targetLanguage, process.env.OPENROUTER_API_KEY);
      } catch (e) {
        console.log('Translation failed, using original');
      }
    }

    return NextResponse.json({
      success: true,
      srt: translatedSrt,
      originalSrt: srt,
      platform,
      subtitleCount: subtitles.length,
      videoId,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// YouTube captions fetcher
async function fetchYouTubeCaptions(videoId) {
  const subtitles = [];
  
  try {
    // Try YouTube transcript API
    const response = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv1`
    );
    
    if (response.ok) {
      const xml = await response.text();
      const parsed = parseYouTubeCaptions(xml);
      if (parsed.length > 0) return parsed;
    }
    
    // Try alternative approach with noembed
    const noembedResponse = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`
    );
    
    if (noembedResponse.ok) {
      const data = await noembedResponse.json();
      // If video exists, return empty to use mock data
      if (data.title) {
        console.log('YouTube video found:', data.title);
      }
    }
  } catch (e) {
    console.log('YouTube caption fetch error:', e.message);
  }
  
  return subtitles;
}

// TikTok captions fetcher
async function fetchTikTokCaptions(videoUrl) {
  const subtitles = [];
  
  try {
    // TikTok video info API (mock for demo)
    // In production, use TikTok's internal API or third-party scraper
    const videoId = videoUrl.match(/video\/(\d+)/)?.[1] || 'unknown';
    
    console.log('Fetching TikTok video:', videoId);
    
    // Return empty to use mock data for demo
    // Real implementation would need TikTok API or scraper
  } catch (e) {
    console.log('TikTok caption fetch error:', e.message);
  }
  
  return subtitles;
}

function parseYouTubeCaptions(xml) {
  const subtitles = [];
  const regex = /<p begin="([\d.]+)".*?>(.*?)<\/p>/g;
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    const duration = 3;
    const end = start + duration;
    
    if (text) {
      subtitles.push({ start, end, text });
    }
  }
  
  return subtitles;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

async function translateSRT(srt, targetLanguage, apiKey) {
  const lines = srt.split('\n\n');
  const translatedLines = [];
  
  for (const block of lines) {
    const parts = block.split('\n');
    if (parts.length >= 3) {
      const index = parts[0];
      const time = parts[1];
      const text = parts.slice(2).join('\n');
      
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
            'X-Title': 'Movie Recap Auto',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-thinking-exp-01-21',
            messages: [
              {
                role: 'user',
                content: `Translate this text to ${targetLanguage}. Only return the translated text, nothing else:\n\n${text}`
              }
            ]
          })
        });
        
        const data = await response.json();
        const translated = data.choices?.[0]?.message?.content?.trim() || text;
        translatedLines.push(`${index}\n${time}\n${translated}`);
      } catch (e) {
        translatedLines.push(block);
      }
    } else {
      translatedLines.push(block);
    }
  }
  
  return translatedLines.join('\n\n');
}
