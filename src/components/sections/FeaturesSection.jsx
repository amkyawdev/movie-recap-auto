'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Shield, Globe, Clock, Download, Upload } from 'lucide-react';

const features = [
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Lightning Fast',
    description: 'Process videos in minutes with our optimized pipeline',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Secure Processing',
    description: 'Your data is encrypted and never stored on our servers',
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Global Support',
    description: 'Support for videos from YouTube, TikTok, and more',
  },
  {
    icon: <Clock className="h-6 w-6" />,
    title: '24/7 Available',
    description: 'Access our service anytime, anywhere',
  },
  {
    icon: <Download className="h-6 w-6" />,
    title: 'Easy Export',
    description: 'Download SRT files and audio in various formats',
  },
  {
    icon: <Upload className="h-6 w-6" />,
    title: 'Direct Upload',
    description: 'Upload your own videos for processing',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container px-4 mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Everything you need to transform video content into accessible formats
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="text-primary mb-2">{feature.icon}</div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
