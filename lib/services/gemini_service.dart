import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math'; // Added for Random
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;

import '../models/types.dart';
import '../utils/story_parser.dart';

class GeminiService {
  final String _apiKey;

  GeminiService(this._apiKey);

  GeminiService.withKey(this._apiKey);

  // --- Model Configuration ---
  // Uncomment the line you wish to use.
  // static const String _mainModel = 'gemini-1.5-pro'; // Standard Pro model
  // static const String _mainModel = 'gemini-3-flash-preview'; // Faster, cheaper
  static const String _mainModel = 'gemini-1.5-pro';

  // For image generation
  static const String _imageModel = 'imagen-4.0-fast-generate-001';

  Future<String> generateImage(String prompt) async {
    try {
      // Use the predict endpoint for Imagen
      final url = Uri.parse(
        'https://generativelanguage.googleapis.com/v1beta/models/$_imageModel:predict?key=$_apiKey',
      );
      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "instances": [
            {"prompt": prompt},
          ],
          "parameters": {
            "sampleCount": 1,
            "aspectRatio": "1:1",
            "outputOptions": {"mimeType": "image/jpeg"},
          },
        }),
      );

      debugPrint('Image Gen Response Status: ${response.statusCode}');
      // debugPrint('Image Gen Response Body: ${response.body}'); // Uncomment for verbose debug

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['predictions'] != null && data['predictions'].isNotEmpty) {
          final bytes = data['predictions'][0]['bytesBase64Encoded'];
          if (bytes != null) {
            return 'data:image/jpeg;base64,$bytes';
          }
        }
        // Fallback or different structure check
        if (data['predictions'] != null &&
            data['predictions'].isNotEmpty &&
            data['predictions'][0]['mimeType'] != null &&
            data['predictions'][0]['bytesBase64Encoded'] != null) {
          final mime = data['predictions'][0]['mimeType'];
          final bytes = data['predictions'][0]['bytesBase64Encoded'];
          return 'data:$mime;base64,$bytes';
        }
      }
      debugPrint('Image Gen failed: ${response.statusCode} ${response.body}');
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
    final modelName = _mainModel;

    if (ageGroup == AgeGroup.TWEENS) {
      // For TWEENS, we want a more structured approach following the template.
      // If the user wants the "whole story at once", we might need a different method,
      // but for generateStorySegment, we'll enforce the template style.

      final model = GenerativeModel(
        model: modelName,
        apiKey: _apiKey,
        // No schema for TWEENS because we want them to follow the text template
      );

      String template = "";
      try {
        template = await rootBundle.loadString(
          'assets/story_prompts/story_template.txt',
        );
      } catch (e) {
        debugPrint("Error loading story template: $e");
        template =
            "[Use standard mystery/sci-fi structure with Page X headers and choices]";
      }

      final promptText = '''
        You are a professional author writing a long-form interactive story for tweens (9-12).
        
        STORY TEMPLATE / GUIDELINES:
        $template

        TASK:
        Generate the ENTIRE story titled "$title" from beginning to end.
        Follow the template exactly, including all branching paths and endings.
        Each page MUST start with "Page X" on a new line.
        Include interactive choices in the specified format: "If you [action], TURN TO PAGE [number]."
        
        IMAGE RULES (Only for Tweens):
        1. Mark exactly ONE page naturally in the middle of each major path as a "[KEY MOMENT]" (e.g., at the end of the text on that page).
        2. The final page of each path should be marked "[FINAL MOMENT]".
        
        Ensure the story is complete and follows the 200-page structure (or as close as you can get while remaining coherent).
      ''';

      final response = await model.generateContent([Content.text(promptText)]);
      if (response.text != null) {
        return StoryParser.parseTemplateStory(response.text!);
      }
    } else {
      // KIDS - Keep existing JSON schema logic
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
      if (previousContext == null) {
        promptText = '''
          Write a children's story titled "$title". 
          It should be suitable for ages 5-8. 
          Write the FIRST $count pages.
          Each page should have simple, readable text (2-3 sentences max).
          Provide a detailed image prompt for each page.
          Format as a JSON array of objects with 'text' and 'imagePrompt' fields.
        ''';
      } else {
        promptText = '''
          Continue the children's story "$title".
          CONTEXT SO FAR: $previousContext
          Write the NEXT $count pages. Each page 2-3 sentences.
          Provide a detailed image prompt for each page.
          Format as a JSON array of objects with 'text' and 'imagePrompt' fields.
        ''';
      }

      final response = await model.generateContent([Content.text(promptText)]);
      if (response.text != null) {
        final List<dynamic> json = jsonDecode(response.text!);
        return json.map((e) => StoryPage.fromJson(e)).toList();
      }
    }
    throw Exception("Story generation failed");
  }

  Future<StoryChallenge> generateStoryChoice(
    String title,
    String currentSummary,
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
        '''Based on the story "$title" and the current situation: "$currentSummary", provide the next major choice for the protagonist.
        Provide 2-3 distinct options that will steer the story in different directions.
        For 'path', use labels like 'PATH_A', 'PATH_B', 'PATH_C' or descriptive keywords.''';

    final response = await model.generateContent([Content.text(prompt)]);
    debugPrint("Story Choice Response: ${response.text}");

    if (response.text != null) {
      final json = jsonDecode(response.text!);
      return StoryChallenge.fromJson({
        'id': Random().nextDouble().toString(),
        ...json,
        'type': 'SUGGESTION',
      });
    }
    throw Exception("Story choice generation failed");
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
