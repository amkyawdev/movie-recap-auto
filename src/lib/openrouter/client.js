import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export const openrouterClient = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

export async function generateCompletion(model, messages, options = {}) {
  try {
    const response = await openrouterClient.post('/chat/completions', {
      model,
      messages,
      ...options,
    });
    return response.data;
  } catch (error) {
    console.error('OpenRouter API Error:', error.response?.data || error.message);
    throw error;
  }
}

export async function generateSpeech(text, voice = 'alloy') {
  try {
    const response = await openrouterClient.post('/audio/speech', {
      model: 'openai/tts-1',
      input: text,
      voice,
    });
    return response.data;
  } catch (error) {
    console.error('OpenRouter TTS Error:', error.response?.data || error.message);
    throw error;
  }
}
