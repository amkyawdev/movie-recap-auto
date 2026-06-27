'use client';

import { useEffect, useState } from 'react';

export function LoadingAnimation({ message = 'Processing...' }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      {/* Droplet Wave Animation */}
      <div className="relative w-32 h-32 mb-6">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background circles */}
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" className="text-purple-200 dark:text-purple-900 opacity-30" />
          <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="1" className="text-purple-300 dark:text-purple-800 opacity-40" />
          <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="1" className="text-purple-400 dark:text-purple-700 opacity-50" />
          
          {/* Droplet */}
          <Droplet />
        </svg>
        
        {/* Loading ring */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin" />
        </div>
      </div>

      {/* Message */}
      <div className="text-center">
        <p className="text-lg font-medium text-purple-600 dark:text-purple-400 mb-2">
          {message}{dots}
        </p>
        <div className="flex items-center justify-center gap-2">
          <LoadingStep step="Extracting" />
          <LoadingStep step="Translating" />
          <LoadingStep step="Generating" />
          <LoadingStep step="Finalizing" />
        </div>
      </div>
    </div>
  );
}

function Droplet() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setOffset(prev => (prev + 1) % 4);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  const positions = [
    { x: 50, y: 20 },
    { x: 80, y: 50 },
    { x: 50, y: 80 },
    { x: 20, y: 50 },
  ];

  const pos = positions[offset];

  return (
    <g>
      {/* Main droplet */}
      <circle
        cx={pos.x}
        cy={pos.y}
        r="6"
        fill="currentColor"
        className="text-purple-500 dark:text-purple-400"
      >
        <animate
          attributeName="r"
          values="6;8;6"
          dur="0.8s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="1;0.7;1"
          dur="0.8s"
          repeatCount="indefinite"
        />
      </circle>
      
      {/* Ripple circles */}
      {[1, 2, 3].map(i => (
        <circle
          key={i}
          cx={pos.x}
          cy={pos.y}
          r={6 + i * 4}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-purple-400 dark:text-purple-500"
          opacity={0.5 / i}
        >
          <animate
            attributeName="r"
            values={`${6 + i * 4};${10 + i * 6};${6 + i * 4}`}
            dur="1.6s"
            begin={`${i * 0.2}s`}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values={`${0.5 / i};0;${0.5 / i}`}
            dur="1.6s"
            begin={`${i * 0.2}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </g>
  );
}

function LoadingStep({ step }) {
  return (
    <div className="flex items-center gap-1">
      <div className="w-2 h-2 rounded-full bg-purple-400 dark:bg-purple-500 animate-pulse" />
      <span className="text-xs text-purple-500 dark:text-purple-400">{step}</span>
    </div>
  );
}

// Progress bar with wave animation
export function WaveProgress({ progress, status }) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between text-sm text-purple-600 dark:text-purple-400 mb-2">
        <span>{status}</span>
        <span>{progress}%</span>
      </div>
      <div className="h-3 bg-purple-100 dark:bg-purple-900 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300 relative"
          style={{ width: `${progress}%` }}
        >
          {/* Wave effect on progress bar */}
          <div className="absolute inset-0 overflow-hidden">
            <svg className="absolute top-0 left-0 w-full h-full" preserveAspectRatio="none">
              <path
                d="M0,10 Q12.5,0 25,10 T50,10 T75,10 T100,10 V20 H0 Z"
                fill="rgba(255,255,255,0.3)"
                className="animate-pulse"
              >
                <animateTransform
                  attributeName="transform"
                  type="translate"
                  values="0,0;25,0;0,0"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
