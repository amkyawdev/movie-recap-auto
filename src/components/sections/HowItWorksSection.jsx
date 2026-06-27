'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Link2, Languages, Volume2, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: <Link2 className="h-6 w-6" />,
    title: 'Paste Video URL',
    description: 'Enter the URL of any YouTube or TikTok video',
  },
  {
    icon: <Languages className="h-6 w-6" />,
    title: 'Extract & Translate',
    description: 'AI automatically extracts subtitles and translates them',
  },
  {
    icon: <Volume2 className="h-6 w-6" />,
    title: 'Generate Voiceover',
    description: 'Create natural-sounding audio narration',
  },
  {
    icon: <CheckCircle className="h-6 w-6" />,
    title: 'Download Results',
    description: 'Get your subtitles and audio files ready to use',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Transform any video in just a few simple steps
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full text-center relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm">{step.description}</p>
                  <div className="absolute -right-4 -bottom-4 text-6xl font-bold text-muted/10">
                    {index + 1}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
