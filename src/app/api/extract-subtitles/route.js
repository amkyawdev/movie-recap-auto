import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { videoUrl, targetLanguage = 'English', translate = false } = await request.json();

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
      const match = videoUrl.match(/video\/(\d+)/);
      videoId = match ? match[1] : videoUrl.split('/').pop().split('?')[0];
      
      subtitles = await fetchTikTokCaptions(videoUrl);
    }

    // If no captions found, return error
    if (subtitles.length === 0) {
      return NextResponse.json({
        success: false,
        error: platform === 'youtube' 
          ? 'No captions available for this YouTube video. Make sure the video has captions/subtitles enabled.'
          : 'No captions available for this video.',
        platform,
        videoId,
      });
    }

    // Convert to SRT format
    const srt = subtitles.map((sub, i) => {
      return `${i + 1}
${formatTime(sub.start)} --> ${formatTime(sub.end)}
${sub.text}`;
    }).join('\n\n');

    // Translate if requested and not already English
    let finalSrt = srt;
    if (translate && targetLanguage !== 'English' && process.env.OPENROUTER_API_KEY) {
      try {
        setStatus('Translating...');
        finalSrt = await translateSRT(srt, targetLanguage, process.env.OPENROUTER_API_KEY);
      } catch (e) {
        console.log('Translation failed, using original');
      }
    }

    return NextResponse.json({
      success: true,
      srt: finalSrt,
      originalSrt: srt,
      platform,
      subtitleCount: subtitles.length,
      videoId,
      message: 'Subtitles extracted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// YouTube captions fetcher - multiple methods
async function fetchYouTubeCaptions(videoId) {
  const subtitles = [];
  
  // Method 1: Try srv1 format (timedtext API)
  try {
    const response = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=srv1`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const xml = await response.text();
      const parsed = parseYouTubeCaptionsSRV1(xml);
      if (parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.log('SRV1 fetch failed:', e.message);
  }

  // Method 2: Try vtt format
  try {
    const response = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=vtt`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const vtt = await response.text();
      const parsed = parseYouTubeCaptionsVTT(vtt);
      if (parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.log('VTT fetch failed:', e.message);
  }

  // Method 3: Try without lang parameter
  try {
    const response = await fetch(
      `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=srv1`,
      { signal: AbortSignal.timeout(5000) }
    );
    
    if (response.ok) {
      const xml = await response.text();
      const parsed = parseYouTubeCaptionsSRV1(xml);
      if (parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.log('No-lang fetch failed:', e.message);
  }
  
  return subtitles;
}

// Parse YouTube SRV1 format
function parseYouTubeCaptionsSRV1(xml) {
  const subtitles = [];
  if (!xml || xml.includes('<?xml') === false) return subtitles;
  
  const regex = /<p begin="([\d.]+)".*?dur="([\d.]+)".*?>(.*?)<\/p>/gs;
  let match;
  
  while ((match = regex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]) || 3;
    const text = match[3].replace(/<[^>]+>/g, '').trim();
    
    if (text) {
      subtitles.push({
        start,
        end: start + duration,
        text
      });
    }
  }
  
  return subtitles;
}

// Parse YouTube VTT format
function parseYouTubeCaptionsVTT(vtt) {
  const subtitles = [];
  if (!vtt || !vtt.includes('WEBVTT')) return subtitles;
  
  const lines = vtt.split('\n');
  let currentStart = 0;
  let currentEnd = 0;
  let currentText = '';
  
  for (const line of lines) {
    const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
    
    if (timeMatch) {
      currentStart = parseInt(timeMatch[1]) * 3600 + parseInt(timeMatch[2]) * 60 + parseInt(timeMatch[3]) + parseInt(timeMatch[4]) / 1000;
      currentEnd = parseInt(timeMatch[5]) * 3600 + parseInt(timeMatch[6]) * 60 + parseInt(timeMatch[7]) + parseInt(timeMatch[8]) / 1000;
      currentText = '';
    } else if (line.trim() && !line.includes('WEBVTT') && !line.includes('NOTE')) {
      currentText += (currentText ? '\n' : '') + line.trim();
      
      // Next line or empty line means end of this caption
      const idx = lines.indexOf(line);
      if (idx === lines.length - 1 || (lines[idx + 1] && !lines[idx + 1].includes('-->') && lines[idx + 1].trim() === '')) {
        if (currentText) {
          subtitles.push({
            start: currentStart,
            end: currentEnd,
            text: currentText
          });
        }
      }
    }
  }
  
  return subtitles;
}

// TikTok captions fetcher
async function fetchTikTokCaptions(videoId) {
  // TikTok doesn't have a public captions API
  // This would require third-party scraping which is not reliable
  console.log('TikTok captions not available via public API');
  return [];
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
