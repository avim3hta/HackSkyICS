import React from 'react';

const AnimatedBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated grid particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Flowing energy lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <linearGradient id="energyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal energy flows */}
        <line
          x1="0"
          y1="20%"
          x2="100%"
          y2="20%"
          stroke="url(#energyGradient)"
          strokeWidth="2"
          className="animate-pulse"
        />
        <line
          x1="0"
          y1="40%"
          x2="100%"
          y2="40%"
          stroke="url(#energyGradient)"
          strokeWidth="1"
          className="animate-pulse"
          style={{ animationDelay: '1s' }}
        />
        <line
          x1="0"
          y1="60%"
          x2="100%"
          y2="60%"
          stroke="url(#energyGradient)"
          strokeWidth="2"
          className="animate-pulse"
          style={{ animationDelay: '2s' }}
        />
        <line
          x1="0"
          y1="80%"
          x2="100%"
          y2="80%"
          stroke="url(#energyGradient)"
          strokeWidth="1"
          className="animate-pulse"
          style={{ animationDelay: '0.5s' }}
        />
      </svg>

      {/* Radial energy pulses */}
      <div className="absolute top-1/4 left-1/4">
        <div className="w-32 h-32 border border-cyan-500/20 rounded-full animate-ping" />
        <div className="absolute inset-4 w-24 h-24 border border-cyan-400/30 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-8 w-16 h-16 border border-cyan-300/40 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
      </div>

      <div className="absolute bottom-1/4 right-1/4">
        <div className="w-24 h-24 border border-purple-500/20 rounded-full animate-ping" style={{ animationDelay: '1.5s' }} />
        <div className="absolute inset-3 w-18 h-18 border border-purple-400/30 rounded-full animate-ping" style={{ animationDelay: '2.5s' }} />
      </div>

      {/* Floating orbs */}
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-green-400/40 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-blue-400/40 rounded-full animate-bounce" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-2/3 left-1/4 w-1 h-1 bg-yellow-400/40 rounded-full animate-bounce" style={{ animationDelay: '2.5s' }} />
    </div>
  );
};

export default AnimatedBackground;

