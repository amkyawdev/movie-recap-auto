# Movie Recap Auto

AI-powered video subtitles and voiceover generator. Transform YouTube and TikTok videos into engaging content with automatic subtitle extraction, translation, and natural voiceover generation.

## Features

- 🎨 **Premium UI Design** - Glassmorphism + Neumorphism Hybrid with Dark/Light Mode
- 🌐 **Multi-Language Support** - Translate subtitles to 50+ languages including Myanmar
- 🎙️ **Natural Voiceover** - Generate human-like speech with advanced TTS technology
- ⚡ **Lightning Fast** - Process videos in minutes with our optimized pipeline
- 🔒 **Secure Processing** - Your data is encrypted and never stored on our servers
- 📱 **Responsive Design** - Works beautifully from mobile to 4K displays

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **State Management**: Zustand
- **UI Components**: Radix UI + shadcn/ui style
- **AI Integration**: OpenRouter API

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/amkyawdev/movie-recap-auto.git
cd movie-recap-auto

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Add your API keys to .env.local
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
movie-recap-auto/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/            # React Components
│   │   ├── ui/               # Base UI Components
│   │   ├── layout/           # Layout Components
│   │   ├── sections/          # Page Sections
│   │   └── ...
│   ├── hooks/                 # Custom React Hooks
│   ├── lib/                   # Core Libraries
│   ├── store/                 # Zustand Store
│   └── config/                # Configuration
├── public/                    # Static Assets
└── ...
```

## API Routes

- `POST /api/extract-subtitles` - Extract subtitles from video URL
- `POST /api/convert-to-speech` - Generate TTS audio
- `POST /api/process-video` - Full video processing pipeline

## License

MIT License - see LICENSE file for details.

---

Built with ❤️ by [amkyawdev](https://github.com/amkyawdev)
