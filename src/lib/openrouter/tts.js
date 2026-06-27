import { generateCompletion } from './client';

export async function textToSpeech(text, voice = 'alloy') {
  const messages = [
    {
      role: 'system',
      content: 'You are a TTS service. Convert the provided text to speech.',
    },
    {
      role: 'user',
      content: `Generate speech for: ${text}`,
    },
  ];

  try {
    const response = await generateCompletion('openai/tts-1', messages, {
      voice,
    });
    return response;
  } catch (error) {
    console.error('TTS Error:', error);
    throw new Error('Failed to generate speech');
  }
}

export async function srtToSpeech(srtContent, voice = 'alloy') {
  const lines = srtContent.split('\n');
  const speechParts = [];

  for (const line of lines) {
    if (line.trim() && !/^\d+$/.test(line.trim()) && !line.includes('-->')) {
      speechParts.push(line.trim());
    }
  }

  const fullText = speechParts.join(' ');
  return await textToSpeech(fullText, voice);
}
