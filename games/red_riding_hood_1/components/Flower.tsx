import React from 'react';
import { motion, PanInfo } from 'framer-motion';
import { FlowerType, FlowerData } from '../types';
import { FLOWER_COLORS } from '../constants';
import { Sparkles } from 'lucide-react';

interface FlowerProps {
  data: FlowerData;
  containerRef: React.RefObject<HTMLDivElement>;
  onDragEnd: (id: string, point: { x: number; y: number }) => void;
}

const Flower: React.FC<FlowerProps> = ({ data, containerRef, onDragEnd }) => {
  const colorClass = FLOWER_COLORS[data.type];

  // Helper to render distinct shapes based on type
  const renderFlowerSVG = () => {
    // Common stem for all flowers
    const stem = (
      <path
        d="M12 14 Q 12 18 11 24"
        stroke="#15803d"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
    );
    const leaf = (
      <path
        d="M12 18 Q 16 17 17 15"
        stroke="#15803d"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    );

    switch (data.type) {
      case FlowerType.RED_ROSE:
        return (
          <svg viewBox="0 0 24 24" style={{ width: '3.5rem', height: '3.5rem', overflow: 'visible', filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))' }}>
            {stem}
            {leaf}
            <g transform="translate(12, 11)">
              <circle cx="0" cy="-3.5" r="3.5" fill="#ef4444" />
              <circle cx="3.5" cy="-1.2" r="3.5" fill="#ef4444" />
              <circle cx="2.2" cy="3.5" r="3.5" fill="#ef4444" />
              <circle cx="-2.2" cy="3.5" r="3.5" fill="#ef4444" />
              <circle cx="-3.5" cy="-1.2" r="3.5" fill="#ef4444" />
              <circle cx="0" cy="0" r="2.8" fill="#fde047" />
            </g>
          </svg>
        );
      case FlowerType.BLUE_VIOLET:
        return (
          <svg viewBox="0 0 24 24" style={{ width: '3rem', height: '3rem', overflow: 'visible', filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))' }}>
            {stem}
            <g transform="translate(0, -1)">
              <path d="M12 2C9 2 7 5 7 8c0 3 5 8 5 8s5-5 5-8c0-3-2-6-5-6z" transform="rotate(0 12 12)" fill="#3b82f6" />
              <path d="M12 2C9 2 7 5 7 8c0 3 5 8 5 8s5-5 5-8c0-3-2-6-5-6z" transform="rotate(72 12 12)" fill="#3b82f6" />
              <path d="M12 2C9 2 7 5 7 8c0 3 5 8 5 8s5-5 5-8c0-3-2-6-5-6z" transform="rotate(144 12 12)" fill="#3b82f6" />
              <path d="M12 2C9 2 7 5 7 8c0 3 5 8 5 8s5-5 5-8c0-3-2-6-5-6z" transform="rotate(216 12 12)" fill="#3b82f6" />
              <path d="M12 2C9 2 7 5 7 8c0 3 5 8 5 8s5-5 5-8c0-3-2-6-5-6z" transform="rotate(288 12 12)" fill="#3b82f6" />
              <circle cx="12" cy="12" r="3" fill="#fde047" />
            </g>
          </svg>
        );
      case FlowerType.YELLOW_DAISY:
        return (
          <svg viewBox="0 0 24 24" style={{ width: '3.5rem', height: '3.5rem', overflow: 'visible', filter: 'drop-shadow(0 4px 3px rgb(0 0 0 / 0.07))' }}>
            {stem}
            <g transform="translate(0, -2)">
              <path d="M12 2L13 8L19 8L15 12L17 18L12 15L7 18L9 12L5 8L11 8L12 2Z" fill="#facc15" />
              <circle cx="12" cy="12" r="3" fill="#d97706" />
            </g>
          </svg>
        );
      case FlowerType.WHITE_WEED:
      default:
        return (
          <div style={{ position: 'relative' }}>
            <svg viewBox="0 0 24 24" style={{ width: '2.5rem', height: '2.5rem', overflow: 'visible' }}>
              <path d="M12 20 Q 12 15 10 10" stroke="#a3a3a3" strokeWidth="2" fill="none" />
              <foreignObject x="0" y="0" width="32" height="32">
                <Sparkles style={{ width: '2rem', height: '2rem', color: '#d1d5db', opacity: 0.8 }} />
              </foreignObject>
            </svg>
          </div>
        );
    }
  };

  return (
    <motion.div
      drag
      dragConstraints={containerRef}
      dragElastic={0.2}
      dragMomentum={false}
      // When drag ends, we pass the pointer position to check if it dropped on the basket
      onDragEnd={(e, info: PanInfo) => {
        onDragEnd(data.id, info.point);
      }}
      whileHover={{ scale: 1.2, cursor: 'grab' }}
      whileDrag={{ scale: 1.3, cursor: 'grabbing', zIndex: 50 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, rotate: data.rotation }}
      style={{
        position: 'absolute',
        left: data.x,
        top: data.y,
        touchAction: 'none',
      }}
      className="absolute flex items-center justify-center p-2"
    >
      {renderFlowerSVG()}
    </motion.div>
  );
};

export default Flower;