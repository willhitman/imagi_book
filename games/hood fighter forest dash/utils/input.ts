import { useEffect, useRef } from 'react';

export const useGameInput = (
  onJump: () => void,
  onSlideStart: () => void,
  onSlideEnd: () => void,
  isPlaying: boolean
) => {
  const touchStartTime = useRef<number>(0);
  const isSliding = useRef<boolean>(false);

  useEffect(() => {
    if (!isPlaying) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        onJump();
      } else if (e.code === 'ArrowDown') {
        if (!isSliding.current) {
          isSliding.current = true;
          onSlideStart();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown') {
        isSliding.current = false;
        onSlideEnd();
      }
    };

    // Touch / Mouse Logic for "Tap to Jump, Hold to Slide"
    // To make it responsive: 
    // Press Down -> Immediately Slide (Crouch)
    // Release Quickly -> Jump
    // Release Slowly -> Stop Sliding

    const handlePointerDown = (e: PointerEvent | TouchEvent) => {
      // Prevent default to stop scrolling/zooming
      // e.preventDefault(); 
      touchStartTime.current = performance.now();
      isSliding.current = true;
      onSlideStart();
    };

    const handlePointerUp = (e: PointerEvent | TouchEvent) => {
      // e.preventDefault();
      const duration = performance.now() - touchStartTime.current;
      isSliding.current = false;
      onSlideEnd();

      // If tap was quick (less than 200ms), interpret as Jump
      if (duration < 200) {
        onJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // We attach these to window to catch drags outside canvas
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    // Touch events for mobile specifically if pointer events fail
    window.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('touchend', handlePointerUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isPlaying, onJump, onSlideStart, onSlideEnd]);
};
