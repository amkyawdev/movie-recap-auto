export function parseSRT(srtContent) {
  const blocks = srtContent.trim().split(/\n\s*\n/);
  const subtitles = [];

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    const index = parseInt(lines[0], 10);
    const timeLine = lines[1];
    const textLines = lines.slice(2);

    const [startTime, endTime] = timeLine.split(' --> ').map(t => t.trim());

    subtitles.push({
      index,
      startTime,
      endTime,
      text: textLines.join('\n'),
    });
  }

  return subtitles;
}

export function generateSRT(subtitles) {
  return subtitles
    .map((sub, i) => {
      return `${i + 1}\n${sub.startTime} --> ${sub.endTime}\n${sub.text}`;
    })
    .join('\n\n');
}

export function srtToVTT(srtContent) {
  return 'WEBVTT\n\n' + srtContent.replace(/(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/g, '$2 --> $3');
}
