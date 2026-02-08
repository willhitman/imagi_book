import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math'; // Added for Random
import 'package:flutter/foundation.dart';

import '../models/types.dart';
import '../story_prompts/templates.dart';

class GeminiService {
  final String _apiKey;

  GeminiService(this._apiKey);

  GeminiService.withKey(this._apiKey);

  // --- Model Configuration ---
  // Uncomment the line you wish to use.
  // static const String _mainModel = 'gemini-1.5-pro'; // Standard Pro model
  // static const String _mainModel = 'gemini-1.5-flash'; // Faster, cheaper
  // static const String _mainModel = 'gemini-3.0-pro-exp'; // FUTURE: 3.0 Pro Experimental
  static const String _mainModel =
      'gemini-1.5-pro'; // Defaulting to 1.5 Pro as "current best"

  // For image generation (Flash is typically better/faster for this or specialized)
  static const String _imageModel = 'gemini-1.5-flash';

  Future<String> generateImage(String prompt) async {
    try {
      final url = Uri.parse(
        'https://generativelanguage.googleapis.com/v1beta/models/$_imageModel:generateContent?key=$_apiKey',
      );
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "contents": [
            {
              "parts": [
                {"text": prompt},
              ],
            },
          ],
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['candidates'] != null &&
            data['candidates'].isNotEmpty &&
            data['candidates'][0]['content'] != null &&
            data['candidates'][0]['content']['parts'] != null &&
            data['candidates'][0]['content']['parts'].isNotEmpty) {
          final part = data['candidates'][0]['content']['parts'][0];
          if (part['inlineData'] != null) {
            final mime = part['inlineData']['mimeType'];
            final data = part['inlineData']['data'];
            return 'data:$mime;base64,$data';
          }
        }
      }
      debugPrint('Image Gen failed: ${response.body}');
      return 'https://placehold.co/1024x1024?text=Image+Generation+Error';
    } catch (e) {
      debugPrint('Error generating image: $e');
      return 'https://placehold.co/1024x1024?text=Error';
    }
  }

  Future<List<StoryPage>> generateStorySegment(
    String title,
    AgeGroup ageGroup,
    int startPage,
    int count, {
    String? previousContext,
  }) async {
    // Override model for Tweens if needed, or use main model
    final modelName = _mainModel;
    final model = GenerativeModel(
      model: modelName,
      apiKey: _apiKey,
      generationConfig: GenerationConfig(
        responseMimeType: 'application/json',
        responseSchema: Schema.array(
          items: Schema.object(
            properties: {
              'text': Schema.string(),
              'imagePrompt': Schema.string(),
            },
            requiredProperties: ['text', 'imagePrompt'],
          ),
        ),
      ),
    );

    String promptText;
    if (ageGroup == AgeGroup.TWEENS && previousContext == null) {
      // First segment for TWEENS: Use the detailed template
      promptText = '''
        Using the following template, write the FIRST 5 pages of a story titled "$title".
        
        TEMPLATE:
        $STORY_TEMPLATE
        
        INSTRUCTIONS:
        - Follow the template structure for Section 1.
        - Output the first 5 pages using the template's logic but formatted as the requested JSON array.
        - Ensure choices are clear at the end of relevant pages.
        - Provide a descriptive image prompt for each page.
      ''';
    } else {
      promptText =
          previousContext != null
              ? '''Continue the story "$title" for ages 9+.
           CONTEXT SO FAR: $previousContext
           Write the FINAL 5 pages. Each page 4-6 sentences.
           Ensure a satisfying conclusion based on the path chosen.
           Provide a descriptive image prompt for each page.'''
              : '''Write the FIRST 5 pages of a story titled "$title" for ages 5-8.
           Genre: Classic Fairytale adventure.
           Each page: 2-3 sentences.
           Provide a descriptive image prompt for each page.''';
    }

    final response = await model.generateContent([Content.text(promptText)]);

    if (response.text != null) {
      final List<dynamic> json = jsonDecode(response.text!);
      return json.map((e) => StoryPage.fromJson(e)).toList();
    }
    throw Exception("Story generation failed");
  }

  Future<GameChallenge> generateGameChallenge(
    String title,
    String currentText,
    AgeGroup ageGroup,
  ) async {
    final types =
        GameType.values.where((t) => t != GameType.SUGGESTION).toList();
    final isSciFi =
        title.toLowerCase().contains('neon') ||
        title.toLowerCase().contains('project');
    final selectedType =
        isSciFi ? GameType.SCIENCE : types[Random().nextInt(types.length)];

    final model = GenerativeModel(
      model: _mainModel,
      apiKey: _apiKey,
      generationConfig: GenerationConfig(
        responseMimeType: 'application/json',
        responseSchema: Schema.object(
          properties: {
            'type': Schema.string(),
            'prompt': Schema.string(),
            'hint': Schema.string(),
            'config': Schema.object(properties: {}), // Open object
            'choices': Schema.array(
              items: Schema.object(
                properties: {
                  'text': Schema.string(),
                  'outcome': Schema.string(),
                  'path': Schema.string(),
                },
                requiredProperties: ['text', 'outcome', 'path'],
              ),
            ),
          },
          requiredProperties: ['type', 'prompt', 'choices', 'hint', 'config'],
        ),
      ),
    );

    final prompt =
        '''Based on the story "$title" and context: "$currentText", create a ${selectedType.name} interactive challenge.
      - MATCHING: pairs (e.g. slipper-pumpkin).
      - RUNNER: character running from something.
      - PUZZLE: 4 segments of a key item.
      - BATTLE: boss fight with power-ups.
      - SCIENCE: mixing elements for sci-fi.
      Provide configuration (config) for the chosen game.''';

    final response = await model.generateContent([Content.text(prompt)]);

    if (response.text != null) {
      final json = jsonDecode(response.text!);
      return GameChallenge.fromJson({
        'id': Random().nextDouble().toString(),
        ...json,
      });
    }
    throw Exception("Game generation failed");
  }

  Future<GameChallenge> generatePathChallenge(
    String title,
    String currentSummary,
    int challengeIndex,
  ) async {
    final model = GenerativeModel(
      model: _mainModel,
      apiKey: _apiKey,
      generationConfig: GenerationConfig(
        responseMimeType: 'application/json',
        responseSchema: Schema.object(
          properties: {
            'prompt': Schema.string(),
            'hint': Schema.string(),
            'choices': Schema.array(
              items: Schema.object(
                properties: {
                  'text': Schema.string(),
                  'outcome': Schema.string(),
                  'path': Schema.string(),
                },
                requiredProperties: ['text', 'outcome', 'path'],
              ),
            ),
          },
          requiredProperties: ['prompt', 'choices', 'hint'],
        ),
      ),
    );

    final prompt =
        '''Create Challenge #${challengeIndex + 1} of 5 for story "$title".
    Choices: 1. CLASSICAL (Traditional) 2. SHADOW (Dark/Mysterious) 3. ENCHANTED (Magical).''';

    final response = await model.generateContent([Content.text(prompt)]);
    debugPrint("Path Challenge Response: ${response.text}");

    if (response.text != null) {
      final json = jsonDecode(response.text!);
      return GameChallenge.fromJson({
        'id': Random().nextDouble().toString(),
        ...json,
        'type': 'SUGGESTION',
      });
    }
    throw Exception("Path challenge failed");
  }

  Future<Map<String, String>?> defineWord(
    String word,
    String context,
    AgeGroup ageGroup,
  ) async {
    final model = GenerativeModel(
      model: _mainModel,
      apiKey: _apiKey,
      generationConfig: GenerationConfig(responseMimeType: "application/json"),
    );

    final prompt =
        '''Define the word "$word" for a ${ageGroup == AgeGroup.KIDS ? "child (5-8)" : "tween (9-12)"}.
        Context from story: "$context".
        
        Return a JSON object with these exact keys:
        {
          "definition": "Simple definition of the word.",
          "context_meaning": "How this word is used in the specific story context.",
          "real_world_example": "A short, relatable real-world example of using this word."
        }
        Keep it concise and age-appropriate.''';

    try {
      final response = await model.generateContent([Content.text(prompt)]);
      if (response.text == null) return null;

      final json = jsonDecode(response.text!);
      return {
        "definition": json["definition"]?.toString() ?? "Definition not found.",
        "context_meaning": json["context_meaning"]?.toString() ?? "",
        "real_world_example": json["real_world_example"]?.toString() ?? "",
      };
    } catch (e) {
      debugPrint("Error defining word: $e");
      return null;
    }
  }

  Future<Uint8List?> generateSpeech(String text) async {
    // Placeholder: Return empty or mock
    // Real implementation requires sending correct payload to TTS endpoint
    // google_generative_ai currently doesn't expose responseModalities: [AUDIO] easily in high level.
    // Returning null to signal fallback to local TTS.
    // In real app, would use http package to call the REST API.
    return null;
  }
}
