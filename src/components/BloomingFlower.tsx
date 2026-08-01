import React from 'react';

interface BloomingFlowerProps {
  className?: string;
  isUser?: boolean;
}

export function BloomingFlower({ className = "w-4 h-4", isUser = false }: BloomingFlowerProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={`${className} transition-transform duration-500 hover:scale-125 hover:rotate-45 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={`flowerCoreGlow_${isUser ? 'user' : 'bot'}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isUser ? "#a5f3fc" : "#fef08a"} />
          <stop offset="60%" stopColor={isUser ? "#06b6d4" : "#eab308"} />
          <stop offset="100%" stopColor={isUser ? "#0891b2" : "#ca8a04"} />
        </radialGradient>

        <linearGradient id={`petalGradOuter_${isUser ? 'user' : 'bot'}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isUser ? "#ffffff" : "#fbcfe8"} />
          <stop offset="50%" stopColor={isUser ? "#38bdf8" : "#f472b6"} />
          <stop offset="100%" stopColor={isUser ? "#0284c7" : "#c084fc"} />
        </linearGradient>

        <linearGradient id={`petalGradInner_${isUser ? 'user' : 'bot'}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isUser ? "#e0f2fe" : "#fdf2f8"} />
          <stop offset="100%" stopColor={isUser ? "#0ea5e9" : "#e879f9"} />
        </linearGradient>
      </defs>

      {/* Bird's Eye View Outer Layer - 8 Blooming Petals with slow gentle rotation */}
      <g className="origin-center animate-[spin_30s_linear_infinite]">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
          <path
            key={`outer-${idx}`}
            d="M50 50 C38 22 28 8 50 2 C72 8 62 22 50 50Z"
            fill={`url(#petalGradOuter_${isUser ? 'user' : 'bot'})`}
            opacity="0.9"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}

        {/* Bird's Eye View Inner Layer - 8 Offset Blooming Petals */}
        {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, idx) => (
          <path
            key={`inner-${idx}`}
            d="M50 50 C42 30 35 18 50 12 C65 18 58 30 50 50Z"
            fill={`url(#petalGradInner_${isUser ? 'user' : 'bot'})`}
            opacity="0.95"
            transform={`rotate(${angle} 50 50)`}
          />
        ))}
      </g>

      {/* Center Pistil (Stamen / Flower Core) */}
      <circle cx="50" cy="50" r="11" fill={`url(#flowerCoreGlow_${isUser ? 'user' : 'bot'})`} />
      <circle cx="50" cy="50" r="12" stroke="rgba(255,255,255,0.8)" strokeWidth="1.2" fill="none" />
      <circle cx="50" cy="50" r="4.5" fill="#ffffff" opacity="0.95" />
    </svg>
  );
}
