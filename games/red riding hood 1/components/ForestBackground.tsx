import React from 'react';

const CloudShape = ({ scale = 1 }: { scale?: number }) => (
  <div style={{ transform: `scale(${scale})` }}>
    <div className="w-24 h-8 bg-white rounded-full relative">
      <div className="absolute -top-8 left-4 w-12 h-12 bg-white rounded-full" />
      <div className="absolute -top-12 left-8 w-16 h-16 bg-white rounded-full" />
      <div className="absolute -top-6 left-14 w-10 h-10 bg-white rounded-full" />
    </div>
  </div>
);

interface TreeProps {
  color: string;
  width: number;
  height: number;
  delay: number;
  left: string;
}

const Tree: React.FC<TreeProps> = ({ 
  color, 
  width, 
  height, 
  delay, 
  left 
}) => (
  <div 
    className="absolute bottom-0 flex flex-col items-center origin-bottom"
    style={{ 
      left, 
      width, 
      height,
      animation: `sway 4s ease-in-out infinite alternate`,
      animationDelay: `${delay}s`
    }}
  >
    {/* Tree Top (Triangle stack) */}
    {/* Explicitly setting border colors in style to ensure visibility and correct color */}
    <div 
      className="w-0 h-0 absolute bottom-[60%]" 
      style={{ 
        borderLeft: `${width * 0.4}px solid transparent`,
        borderRight: `${width * 0.4}px solid transparent`,
        borderBottom: `${height * 0.4}px solid ${color}`,
      }} 
    />
    <div 
      className="w-0 h-0 absolute bottom-[30%]" 
      style={{ 
        borderLeft: `${width * 0.5}px solid transparent`,
        borderRight: `${width * 0.5}px solid transparent`,
        borderBottom: `${height * 0.5}px solid ${color}`,
      }} 
    />
    <div 
      className="w-0 h-0 absolute bottom-0" 
      style={{ 
        borderLeft: `${width * 0.6}px solid transparent`,
        borderRight: `${width * 0.6}px solid transparent`,
        borderBottom: `${height * 0.6}px solid ${color}`,
      }} 
    />
    {/* Trunk */}
    <div 
      className="absolute -bottom-4 w-[20%] h-[15%] rounded-sm"
      style={{ backgroundColor: '#78350f' }} // Explicit amber-900 hex
    />
  </div>
);

const ForestBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden z-0" style={{ backgroundColor: '#7dd3fc' }}> {/* Sky Blue */}
       <style>{`
         @keyframes move-cloud {
           0% { transform: translateX(-150px); }
           100% { transform: translateX(110vw); }
         }
         @keyframes sway {
           0% { transform: rotate(-1deg); }
           100% { transform: rotate(1deg); }
         }
          @keyframes sun-pulse {
           0%, 100% { transform: scale(1); opacity: 0.9; }
           50% { transform: scale(1.1); opacity: 1; }
         }
       `}</style>

       {/* Sky Gradient */}
       <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #38bdf8, #e0f2fe)' }} />

       {/* Sun */}
       <div className="absolute top-8 left-8 md:left-20 w-20 h-20 md:w-32 md:h-32 rounded-full shadow-[0_0_60px_rgba(253,224,71,0.8)] animate-[sun-pulse_5s_ease-in-out_infinite]" style={{ backgroundColor: '#fde047' }} />

       {/* Clouds */}
       <div className="absolute top-[10%] left-0 opacity-80" style={{ animation: 'move-cloud 60s linear infinite' }}>
          <CloudShape scale={1.2} />
       </div>
       <div className="absolute top-[20%] left-0 opacity-60" style={{ animation: 'move-cloud 45s linear infinite', animationDelay: '-20s' }}>
          <CloudShape scale={0.8} />
       </div>
       <div className="absolute top-[15%] left-0 opacity-70" style={{ animation: 'move-cloud 75s linear infinite', animationDelay: '-10s' }}>
          <CloudShape scale={1} />
       </div>

       {/* Far Hills (Background) */}
       <div className="absolute bottom-0 w-full h-[60%] opacity-60">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 320">
             <path fill="#166534" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
       </div>

       {/* Middle Ground Trees */}
       <div className="absolute bottom-[25vh] left-0 right-0 h-[200px] pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
             <Tree 
                key={`tree-back-${i}`} 
                color="#15803d" // green-700
                width={80 + Math.random() * 40} 
                height={180 + Math.random() * 60} 
                delay={i * 0.5} 
                left={`${5 + i * 13}%`}
             />
          ))}
       </div>

       {/* Near Hills (Foreground) */}
       <div className="absolute bottom-0 w-full h-[45%]">
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 320">
             <path fill="#22c55e" d="M0,160L48,176C96,192,192,224,288,229.3C384,235,480,213,576,192C672,171,768,149,864,149.3C960,149,1056,171,1152,192C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
          </svg>
       </div>

       {/* Front Layer Trees */}
       <div className="absolute bottom-[10vh] left-0 right-0 h-[150px] pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
             <Tree 
                key={`tree-front-${i}`} 
                color="#4ade80" // green-400 (bright!)
                width={60 + Math.random() * 30} 
                height={120 + Math.random() * 50} 
                delay={i * 0.7 + 2} 
                left={`${10 + i * 18}%`}
             />
          ))}
       </div>
       
       {/* Ambient Overlay to blend everything */}
       <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(to top, rgba(20, 83, 45, 0.4), transparent)' }} />
       
       {/* Falling Particles */}
       <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
               key={`particle-${i}`}
               className="absolute bg-white rounded-full opacity-40"
               style={{
                 width: Math.random() * 4 + 2,
                 height: Math.random() * 4 + 2,
                 left: `${Math.random() * 100}%`,
                 top: `${Math.random() * 100}%`,
                 animation: `move-cloud ${20 + Math.random() * 30}s linear infinite`,
                 animationDelay: `-${Math.random() * 20}s`
               }}
            />
          ))}
       </div>
    </div>
  );
};

export default ForestBackground;