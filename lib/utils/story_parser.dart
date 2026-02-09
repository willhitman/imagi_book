import '../models/types.dart';

class StoryParser {
  static List<StoryPage> parseTemplateStory(String content) {
    final List<String> pageSegments = [];
    final lines = content.split('\n');

    String currentText = "";
    int? currentPageNumber;

    for (var line in lines) {
      final trimmedLine = line.trim();
      final pageMatch = RegExp(r'^Page (\d+)$').firstMatch(trimmedLine);

      if (pageMatch != null) {
        if (currentPageNumber != null && currentText.trim().isNotEmpty) {
          pageSegments.add(currentText);
        }
        currentPageNumber = int.parse(pageMatch.group(1)!);
        currentText = "";
        continue;
      }

      if (currentPageNumber != null) {
        currentText += "$line\n";
      }
    }

    if (currentPageNumber != null && currentText.trim().isNotEmpty) {
      pageSegments.add(currentText);
    }

    final List<StoryPage> pages = [];
    for (int i = 0; i < pageSegments.length; i++) {
      pages.add(_createPage(pageSegments[i], i, pageSegments.length));
    }

    return pages;
  }

  static StoryPage _createPage(String text, int index, int total) {
    String narrative = text.trim();
    List<StoryChoice>? choices;

    final choiceRegex = RegExp(r'If you (.*?), TURN TO PAGE (\d+)\.');
    final matches = choiceRegex.allMatches(narrative);

    if (matches.isNotEmpty) {
      choices = [];
      for (final match in matches) {
        final action = match.group(1);
        final target = int.parse(match.group(2)!);
        choices.add(StoryChoice(text: "If you $action", targetPage: target));
      }
      narrative = narrative.replaceAll(choiceRegex, '').trim();
    }

    // Image Visibility Heuristic
    final upperNarrative = narrative.toUpperCase();
    bool shouldHavePrompt = false;

    if (index == 0) shouldHavePrompt = true; // First page
    if (index == total - 1) shouldHavePrompt = true; // Final page
    if (choices != null && choices.isNotEmpty)
      shouldHavePrompt = true; // Choice page
    if (upperNarrative.contains("KEY MOMENT") ||
        upperNarrative.contains("THE CLIMAX") ||
        upperNarrative.contains("[KEY MOMENT]") ||
        upperNarrative.contains("[FINAL MOMENT]") ||
        upperNarrative.contains("THE END.")) {
      shouldHavePrompt = true;
    }

    return StoryPage(
      text: narrative,
      imagePrompt:
          shouldHavePrompt
              ? "Illustration for: ${narrative.length > 50 ? narrative.substring(0, 50) : narrative}"
              : "",
      choices: choices,
    );
  }
}
