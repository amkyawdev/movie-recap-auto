import { generateCompletion } from './client';

const TRANSLATION_MODEL = 'openai/gpt-4';

export async function translateText(text, targetLanguage = 'Myanmar') {
  const messages = [
    {
      role: 'system',
      content: `You are a professional translator. Translate the following text to ${targetLanguage}. 
                Keep the translation natural, accurate, and maintain the original tone and style.
                Only return the translated text, nothing else.`,
    },
    {
      role: 'user',
      content: text,
    },
  ];

  try {
    const response = await generateCompletion(TRANSLATION_MODEL, messages);
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Translation Error:', error);
    throw new Error('Failed to translate text');
  }
}

export async function translateSRT(srtContent, targetLanguage = 'Myanmar') {
  const lines = srtContent.split('\n');
  let translatedLines = [];
  let textBuffer = [];

  for (const line of lines) {
    if (line.trim() === '' || /^\d+$/.test(line.trim()) || line.includes('-->')) {
      if (textBuffer.length > 0) {
        const fullText = textBuffer.join(' ');
        try {
          const translated = await translateText(fullText, targetLanguage);
          translatedLines.push(translated);
        } catch {
          translatedLines.push(fullText);
        }
        textBuffer = [];
      }
      translatedLines.push(line);
    } else {
      textBuffer.push(line);
    }
  }

  return translatedLines.join('\n');
}
