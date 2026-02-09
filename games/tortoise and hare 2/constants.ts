export const ROAD_WIDTH_PCT = 80; // Road takes up 80% of screen width centered
export const FPS = 60;
export const LANE_SPEED = 1.8; // Lateral movement speed (Increased from 1.5)
export const BASE_SPEED = 18; // Player base forward speed per frame (Increased from 15)
export const BOOST_SPEED = 34; // Player speed when boosted (Increased from 28)
export const BOOST_DURATION_MS = 2000;

// To last ~90 seconds with higher speed:
// 90s * 60fps * 18 units/frame = 97,200. Rounded to 100,000.
export const FINISH_LINE_Z = 100000; 

export const HARE_START_Z = 6000; // Hare starts further ahead (Increased from 5000)
export const HARE_BASE_SPEED = 26.5; // Hare starts faster (Increased from 22)
export const HARE_MIN_SPEED = 13.5; // Hare min speed increased (from 11)

// Decay rate increased to maintain the pacing of the hare getting tired over the same duration
export const HARE_DECAY_RATE = 0.0036; // Increased from 0.003

export const CAMERA_OFFSET_Y = 0.75; // Player is positioned at 75% down the screen
export const RENDER_DISTANCE = 3600; // Increased render distance