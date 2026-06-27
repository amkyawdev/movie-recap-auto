export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export function isYouTubeUrl(url) {
  return url.includes('youtube.com') || url.includes('youtu.be');
}

export function isTikTokUrl(url) {
  return url.includes('tiktok.com');
}

export function isValidVideoUrl(url) {
  return isYouTubeUrl(url) || isTikTokUrl(url);
}

export function validateSRT(content) {
  const pattern = /\d+\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}\n[\s\S]+?/;
  return pattern.test(content);
}
