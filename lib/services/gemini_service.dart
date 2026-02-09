import 'package:google_generative_ai/google_generative_ai.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:math'; // Added for Random
import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart' show rootBundle;

import '../models/types.dart';

class GeminiService {
  final String _apiKey;

  GeminiService(this._apiKey);

  GeminiService.withKey(this._apiKey);

  // --- Model Configuration ---
  // Uncomment the line you wish to use.
  // static const String _mainModel = 'gemini-1.5-pro'; // Standard Pro model
  // static const String _mainModel = 'gemini-3-flash-preview'; // Faster, cheaper
  static const String _mainModel = 'gemini-3-flash-preview';

  // For image generation (Flash is typically better/faster for this or specialized)
  static const String _imageModel = 'gemini-2.5-flash-lite';

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
    if (ageGroup == AgeGroup.TWEENS) {
      String template = "";
      try {
        template = await rootBundle.loadString(
          'assets/story_prompts/story_template.txt',
        );
      } catch (e) {
        debugPrint("Error loading story template: $e");
        template = "[Use standard mystery/sci-fi structure]";
      }

      if (previousContext == null) {
        // First segment for TWEENS
        promptText = '''
          You are a professional author writing a long-form interactive story for tweens (9-12).
          
          STORY TEMPLATE / GUIDELINES:
          $template

          TASK:
          Write the FIRST $count pages of the story titled "$title".
          Follow the "SECTION 1: THE SETUP" guidelines from the template.
          CRITICAL: Do NOT include any options or choices at the end. The choice will be presented separately.
          End the segment at a cliiffhanger or decision point.
          
          OUTPUT FORMAT:
          Formatted as a JSON array of objects with 'text' and 'imagePrompt' fields.
          Each page should be 3-5 sentences.
          Ensure the style matches the "Tone" detailed in the template.
        ''';
      } else {
        // Continuation for TWEENS
        promptText = '''
          You are continuing a long-form interactive story for tweens (9-12).
          
          STORY TEMPLATE / GUIDELINES:
          $template

          CONTEXT SO FAR: 
          $previousContext

          TASK:
          Write the NEXT $count pages.
          Continue the narrative arc defined in the template sections.
          CRITICAL: Do NOT include any options or choices at the end. The choice will be presented separately.
          End the segment at a cliiffhanger or decision point.
          
          OUTPUT FORMAT:
          JSON array of objects with 'text' and 'imagePrompt'.
          Each page 3-5 sentences.
        ''';
      }
    } else {
      // KIDS
      if (previousContext == null) {
        promptText = '''
          Write a children's story titled "$title". 
          It should be suitable for ages 5-8. 
          Write the FIRST $count pages.
          Each page should have simple, readable text (2-3 sentences max).
          Provide a detailed image prompt for each page that describes a single, beautiful scene for an animation.
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
    }

    final response = await model.generateContent([Content.text(promptText)]);

    if (response.text != null) {
      final List<dynamic> json = jsonDecode(response.text!);
      return json.map((e) => StoryPage.fromJson(e)).toList();
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
