import 'package:flutter/material.dart';

class AppColors {
  static const Color kidYellow = Color(0xFFFFAB00); // Vibrant Gold
  static const Color kidBlue = Color(0xFF0091EA); // Vibrant Deep Blue
  static const Color kidGreen = Color(0xFF00C853); // Vibrant Emerald
  static const Color kidPink = Color(0xFFFF1744); // Vibrant Bright Red/Pink
  static const Color kidPurple = Color(0xFFD500F9); // Vibrant Purple
  static const Color paper = Color(0xFFB78F2E); // Rich Golden Parchment Tone
  static const Color paperLight = Color(
    0xFFE3C065,
  ); // Lighter tone for contrast if needed
}

class AppDecorations {
  static final BoxDecoration parchmentBackground = BoxDecoration(
    color: AppColors.paper,
    image: const DecorationImage(
      image: NetworkImage(
        "https://www.transparenttextures.com/patterns/paper-fibers.png",
      ),
      repeat: ImageRepeat.repeat,
      opacity: 0.4, // Adjust opacity to blend with base color
    ),
  );

  static final BoxDecoration vignette = BoxDecoration(
    gradient: RadialGradient(
      colors: [Colors.transparent, Colors.black.withOpacity(0.15)],
      stops: const [0.7, 1.0],
      radius: 1.2,
    ),
  );
}
