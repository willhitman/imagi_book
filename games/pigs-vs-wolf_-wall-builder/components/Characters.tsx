import React from 'react';

export const WolfSVG = ({ className, state }: { className?: string, state: 'idle' | 'blowing' | 'happy' | 'sad' }) => {
  return (
    <svg viewBox="0 0 200 200" className={className}>
      <g transform="translate(20, 20)">
        {/* Body */}
        <path d="M60,160 Q40,100 80,60 Q120,20 160,60 Q180,100 160,160 Z" fill="#718096" />
        {/* Head */}
        <circle cx="120" cy="70" r="50" fill="#4A5568" />
        {/* Ears */}
        <path d="M90,30 L80,5 L110,35 Z" fill="#4A5568" />
        <path d="M150,30 L160,5 L130,35 Z" fill="#4A5568" />
        {/* Snout */}
        <ellipse cx="100" cy="80" rx="25" ry="15" fill="#2D3748" />
        <circle cx="95" cy="78" r="3" fill="black" />
        
        {/* Eyes */}
        <circle cx="110" cy="60" r="5" fill="white" />
        <circle cx="110" cy="60" r="2" fill="black" />
        <circle cx="135" cy="60" r="5" fill="white" />
        <circle cx="135" cy="60" r="2" fill="black" />

        {/* Mouth/Expression */}
        {state === 'idle' && <path d="M100,100 Q120,110 140,100" stroke="white" strokeWidth="3" fill="none" />}
        {state === 'blowing' && (
          <g>
            <circle cx="90" cy="90" r="15" fill="black" />
            <path d="M60,90 L0,70 M60,90 L0,90 M60,90 L0,110" stroke="#CBD5E0" strokeWidth="4" strokeDasharray="10,5" />
          </g>
        )}
        {state === 'happy' && <path d="M100,100 Q120,120 140,100" stroke="white" strokeWidth="3" fill="none" />}
        {state === 'sad' && <path d="M100,110 Q120,90 140,110" stroke="white" strokeWidth="3" fill="none" />}
      </g>
    </svg>
  );
};

export const PigsSVG = ({ className, state }: { className?: string, state: 'idle' | 'scared' | 'happy' | 'crying' }) => {
  const Pig = ({ x, y, color }: { x: number, y: number, color: string }) => (
    <g transform={`translate(${x}, ${y})`}>
       {/* Body */}
       <ellipse cx="30" cy="50" rx="25" ry="30" fill={color} />
       {/* Head */}
       <circle cx="30" cy="25" r="20" fill={color} />
       {/* Ears */}
       <path d="M15,10 L10,0 L25,10 Z" fill={color} stroke="#B83280" strokeWidth="1"/>
       <path d="M45,10 L50,0 L35,10 Z" fill={color} stroke="#B83280" strokeWidth="1"/>
       
       {/* Eyes */}
       <circle cx="22" cy="20" r="4" fill="white" />
       <circle cx="22" cy="20" r="1.5" fill="black" />
       <circle cx="38" cy="20" r="4" fill="white" />
       <circle cx="38" cy="20" r="1.5" fill="black" />

       {/* Snout */}
       <ellipse cx="30" cy="30" rx="8" ry="6" fill="#F687B3" />
       <circle cx="28" cy="30" r="1.5" fill="black" />
       <circle cx="32" cy="30" r="1.5" fill="black" />
       
       {/* Expression */}
       {(state === 'happy' || state === 'idle') && <path d="M25,40 Q30,45 35,40" stroke="black" strokeWidth="1.5" fill="none" />}
       {(state === 'scared' || state === 'crying') && <circle cx="30" cy="42" r="3" fill="black" />}
       {state === 'crying' && <path d="M20,35 L20,50" stroke="#63B3ED" strokeWidth="2" />}
    </g>
  );

  return (
    <svg viewBox="0 0 200 100" className={className}>
      <Pig x={10} y={20} color="#FBB6CE" />
      <Pig x={70} y={15} color="#FBB6CE" />
      <Pig x={130} y={20} color="#FBB6CE" />
    </svg>
  );
};