'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Sparkles, Languages, Volume2 } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
      </div>

      <div className="container px-4 mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="gradient-text">AI-Powered</span> Video Subtitles & Voiceover
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto"
          >
            Transform YouTube and TikTok videos into engaging content with automatic subtitle extraction, 
            translation, and natural voiceover generation.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          >
            <Button size="lg" className="gap-2">
              <Play className="h-4 w-4" />
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Sparkles className="h-4 w-4" />
              View Demo
            </Button>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <FeatureCard
              icon={<Languages className="h-8 w-8" />}
              title="Multi-Language"
              description="Translate subtitles to 50+ languages including Myanmar"
            />
            <FeatureCard
              icon={<Volume2 className="h-8 w-8" />}
              title="Natural Voiceover"
              description="Generate human-like speech with advanced TTS technology"
            />
            <FeatureCard
              icon={<Sparkles className="h-8 w-8" />}
              title="AI-Powered"
              description="Leverage cutting-edge AI for accurate transcription"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <Card className="glass dark:glass-dark hover:scale-105 transition-transform">
      <CardContent className="pt-6 text-center">
        <div className="mb-4 text-primary mx-auto w-fit">{icon}</div>
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
