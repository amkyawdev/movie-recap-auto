import { NextResponse } from 'next/server';

const TELEGRAM_API = 'https://api.telegram.org';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(request) {
  try {
    const { action, chat_id, text, document, caption, parse_mode = 'HTML' } = await request.json();

    if (!BOT_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' },
        { status: 500 }
      );
    }

    if (action === 'sendMessage') {
      const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id,
          text,
          parse_mode,
        }),
      });

      const data = await response.json();
      return NextResponse.json({ success: data.ok, data });
    }

    if (action === 'sendDocument') {
      const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/sendDocument`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id,
          document,
          caption,
          parse_mode,
        }),
      });

      const data = await response.json();
      return NextResponse.json({ success: data.ok, data });
    }

    if (action === 'sendAudio') {
      const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/sendAudio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id,
          audio: document,
          caption,
          parse_mode,
        }),
      });

      const data = await response.json();
      return NextResponse.json({ success: data.ok, data });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Webhook handler for Telegram updates
export async function GET(request) {
  if (!BOT_TOKEN) {
    return NextResponse.json({ error: 'Bot not configured' }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const setWebhook = searchParams.get('setWebhook');
  const deleteWebhook = searchParams.get('deleteWebhook');

  if (setWebhook) {
    const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: setWebhook }),
    });
    const data = await response.json();
    return NextResponse.json(data);
  }

  if (deleteWebhook) {
    const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/deleteWebhook`);
    const data = await response.json();
    return NextResponse.json(data);
  }

  // Get bot info
  const response = await fetch(`${TELEGRAM_API}/bot${BOT_TOKEN}/getMe`);
  const data = await response.json();
  return NextResponse.json(data);
}
