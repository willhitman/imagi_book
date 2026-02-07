import 'package:flutter_tts/flutter_tts.dart';
import 'package:flutter/foundation.dart';

class TTSService {
  final FlutterTts flutterTts = FlutterTts();

  double pitch = 1.0;
  double rate = 0.5; // flutter_tts rate range is 0.0 to 1.0
  double volume = 1.0;

  bool isPlaying = false;

  TTSService() {
    _initTts();
  }

  Future<void> _initTts() async {
    await flutterTts.setLanguage("en-US");
    await flutterTts.setSpeechRate(rate);
    await flutterTts.setVolume(volume);
    await flutterTts.setPitch(pitch);

    flutterTts.setStartHandler(() {
      isPlaying = true;
      debugPrint("TTS Started");
    });

    flutterTts.setCompletionHandler(() {
      isPlaying = false;
      debugPrint("TTS Completed");
    });

    flutterTts.setErrorHandler((msg) {
      isPlaying = false;
      debugPrint("TTS Error: $msg");
    });
  }

  Future<void> speak(String text) async {
    if (text.isEmpty) return;
    try {
      // Ensure settings are applied before speaking
      await flutterTts.setPitch(pitch);
      await flutterTts.setSpeechRate(rate);
      await flutterTts.setVolume(volume);

      await flutterTts.speak(text);
    } catch (e) {
      debugPrint("Error speaking: $e");
    }
  }

  Future<void> stop() async {
    await flutterTts.stop();
    isPlaying = false;
  }

  Future<void> setPitch(double newPitch) async {
    pitch = newPitch;
    await flutterTts.setPitch(pitch);
  }

  Future<void> setRate(double newRate) async {
    rate = newRate;
    await flutterTts.setSpeechRate(rate);
  }

  Future<void> setVolume(double newVolume) async {
    volume = newVolume;
    await flutterTts.setVolume(volume);
  }
}
