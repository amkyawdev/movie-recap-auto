import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Movie Recap Auto - AI Video Subtitles & Audio Generator',
  description: 'Generate Myanmar subtitles and natural voiceovers from YouTube and TikTok videos using AI',
  keywords: 'movie recap, subtitles, myanmar, AI, TTS, video processing',
  authors: [{ name: 'Movie Recap Auto' }],
  openGraph: {
    title: 'Movie Recap Auto - AI Video Subtitles & Audio Generator',
    description: 'Generate Myanmar subtitles and natural voiceovers from any video',
    type: 'website',
    url: 'https://movie-recap-auto.com',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Movie Recap Auto',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            <Header />
            <main className="container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  );
}
