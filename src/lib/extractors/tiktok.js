import { BaseExtractor } from './base';

export class TikTokExtractor extends BaseExtractor {
  static isSupported(url) {
    return url.includes('tiktok.com');
  }

  validateUrl() {
    const patterns = [
      /tiktok\.com\/@[\w.]+\/video\/\d+/,
      /tiktok\.com\/v\/\d+/,
      /vm\.tiktok\.com\//,
    ];
    return patterns.some(pattern => pattern.test(this.url));
  }

  extractVideoId() {
    // Extract video ID from various TikTok URL formats
    const patterns = [
      /tiktok\.com\/@[\w.]+\/video\/(\d+)/,
      /tiktok\.com\/v\/(\d+)/,
      /vm\.tiktok\.com\/([\w]+)/,
    ];

    for (const pattern of patterns) {
      const match = this.url.match(pattern);
      if (match) return match[1];
    }
    
    // Fallback: get last part of URL
    return this.url.split('/').pop().split('?')[0];
  }

  async extract() {
    if (!this.validateUrl()) {
      throw new Error('Invalid TikTok URL');
    }

    const videoId = this.extractVideoId();

    // Return info for browser-based audio extraction
    // TikTok requires special handling - we'll use RapidAPI or browser approach
    return {
      videoId,
      platform: 'tiktok',
      url: this.url,
      subtitles: [],
      requiresBrowserExtraction: true,
      message: 'TikTok requires browser-based audio extraction',
    };
  }
}

// Helper function to get TikTok video info (for browser-side extraction)
export async function getTikTokVideoInfo(url) {
  try {
    const response = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        title: data.title,
        author: data.author_name,
        thumbnail: data.thumbnail_url,
      };
    }
  } catch (e) {
    console.log('TikTok oembed error:', e.message);
  }
  return { success: false };
}
