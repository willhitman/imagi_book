import React from 'react';

const CloudShape = ({ scale = 1 }: { scale?: number }) => (
  <div style={{ transform: `scale(${scale})` }}>
    <div style={{ width: '6rem', height: '2rem', backgroundColor: 'white', borderRadius: '9999px', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-2rem', left: '1rem', width: '3rem', height: '3rem', backgroundColor: 'white', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '-3rem', left: '2rem', width: '4rem', height: '4rem', backgroundColor: 'white', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '-1.5rem', left: '3.5rem', width: '2.5rem', height: '2.5rem', backgroundColor: 'white', borderRadius: '50%' }} />
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
    style={{
      position: 'absolute',
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      transformOrigin: 'bottom',
      left,
      width,
      height,
      animation: `sway 4s ease-in-out infinite alternate`,
      animationDelay: `${delay}s`
    }}
  >
    {/* Tree Top (Triangle stack) */}
    <div
      style={{
        position: 'absolute',
        bottom: '60%',
        width: 0,
        height: 0,
        borderLeft: `${width * 0.4}px solid transparent`,
        borderRight: `${width * 0.4}px solid transparent`,
        borderBottom: `${height * 0.4}px solid ${color}`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: '30%',
        width: 0,
        height: 0,
        borderLeft: `${width * 0.5}px solid transparent`,
        borderRight: `${width * 0.5}px solid transparent`,
        borderBottom: `${height * 0.5}px solid ${color}`,
      }}
    />
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        width: 0,
        height: 0,
        borderLeft: `${width * 0.6}px solid transparent`,
        borderRight: `${width * 0.6}px solid transparent`,
        borderBottom: `${height * 0.6}px solid ${color}`,
      }}
    />
    {/* Trunk */}
    <div
      style={{
        position: 'absolute',
        bottom: '-1rem',
        width: '20%',
        height: '15%',
        borderRadius: '0.125rem',
        backgroundColor: '#78350f'
      }}
    />
  </div>
);

const ForestBackground: React.FC = () => {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, backgroundColor: '#7dd3fc' }}>
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
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #38bdf8, #e0f2fe)' }} />

      {/* Sun */}
      <div style={{
        position: 'absolute',
        top: '2rem',
        left: '2rem',
        width: '5rem',
        height: '5rem',
        borderRadius: '50%',
        boxShadow: '0 0 60px rgba(253,224,71,0.8)',
        backgroundColor: '#fde047',
        animation: 'sun-pulse 5s ease-in-out infinite'
      }} />

      {/* Clouds */}
      <div style={{ position: 'absolute', top: '10%', left: 0, opacity: 0.8, animation: 'move-cloud 60s linear infinite' }}>
        <CloudShape scale={1.2} />
      </div>
      <div style={{ position: 'absolute', top: '20%', left: 0, opacity: 0.6, animation: 'move-cloud 45s linear infinite', animationDelay: '-20s' }}>
        <CloudShape scale={0.8} />
      </div>
      <div style={{ position: 'absolute', top: '15%', left: 0, opacity: 0.7, animation: 'move-cloud 75s linear infinite', animationDelay: '-10s' }}>
        <CloudShape scale={1} />
      </div>

      {/* Far Hills (Background) */}
      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '60%', opacity: 0.6 }}>
        <svg style={{ width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path fill="#166534" d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,197.3C1248,171,1344,149,1392,138.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      {/* Middle Ground Trees */}
      <div style={{ position: 'absolute', bottom: '25vh', left: 0, right: 0, height: '200px', pointerEvents: 'none' }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Tree
            key={`tree-back-${i}`}
            color="#15803d"
            width={80 + Math.random() * 40}
            height={180 + Math.random() * 60}
            delay={i * 0.5}
            left={`${5 + i * 13}%`}
          />
        ))}
      </div>

      {/* Near Hills (Foreground) */}
      <div style={{ position: 'absolute', bottom: 0, width: '100%', height: '45%' }}>
        <svg style={{ width: '100%', height: '100%' }} preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path fill="#22c55e" d="M0,160L48,176C96,192,192,224,288,229.3C384,235,480,213,576,192C672,171,768,149,864,149.3C960,149,1056,171,1152,192C1248,213,1344,235,1392,245.3L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </div>

      {/* Front Layer Trees */}
      <div style={{ position: 'absolute', bottom: '10vh', left: 0, right: 0, height: '150px', pointerEvents: 'none' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Tree
            key={`tree-front-${i}`}
            color="#4ade80"
            width={60 + Math.random() * 30}
            height={120 + Math.random() * 50}
            delay={i * 0.7 + 2}
            left={`${10 + i * 18}%`}
          />
        ))}
      </div>

      {/* Ambient Overlay to blend everything */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: 'linear-gradient(to top, rgba(20, 83, 45, 0.4), transparent)' }} />

      {/* Falling Particles */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`particle-${i}`}
            style={{
              position: 'absolute',
              backgroundColor: 'white',
              borderRadius: '50%',
              opacity: 0.4,
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