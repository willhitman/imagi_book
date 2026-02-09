enum AgeGroup { KIDS, TWEENS }

enum Genre { FAIRY, SCIFI, MYSTERY, ADVENTURE }

enum GameType { SUGGESTION }

enum ChoicePath { CLASSICAL, SHADOW, ENCHANTED }

enum AppView { LIBRARY, READER }

class StoryChoice {
  final String text;
  final int targetPage;

  StoryChoice({required this.text, required this.targetPage});

  factory StoryChoice.fromJson(Map<String, dynamic> json) {
    return StoryChoice(
      text: json['text'] ?? '',
      targetPage: json['targetPage'] ?? 0,
    );
  }

  Map<String, dynamic> toJson() => {'text': text, 'targetPage': targetPage};
}

class StoryPage {
  final String text;
  final String imagePrompt;
  String? videoUrl;
  bool isGenerating;
  final List<StoryChoice>? choices;

  StoryPage({
    required this.text,
    required this.imagePrompt,
    this.videoUrl,
    this.isGenerating = false,
    this.choices,
  });

  factory StoryPage.fromJson(Map<String, dynamic> json) {
    return StoryPage(
      text: json['text'] ?? '',
      imagePrompt: json['imagePrompt'] ?? '',
      videoUrl: json['videoUrl'],
      isGenerating: json['isGenerating'] ?? false,
      choices:
          (json['choices'] as List?)
              ?.map((c) => StoryChoice.fromJson(c))
              .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'text': text,
      'imagePrompt': imagePrompt,
      'videoUrl': videoUrl,
      'isGenerating': isGenerating,
      if (choices != null) 'choices': choices!.map((c) => c.toJson()).toList(),
    };
  }
}

class GameChoice {
  final String text;
  final String outcome;
  final ChoicePath path;

  GameChoice({required this.text, required this.outcome, required this.path});

  factory GameChoice.fromJson(Map<String, dynamic> json) {
    return GameChoice(
      text: json['text'] ?? '',
      outcome: json['outcome'] ?? '',
      path: ChoicePath.values.firstWhere(
        (e) => e.name == json['path'],
        orElse: () => ChoicePath.CLASSICAL,
      ),
    );
  }

  Map<String, dynamic> toJson() => {
    'text': text,
    'outcome': outcome,
    'path': path.name,
  };
}

class StoryChallenge {
  final String id;
  final String prompt;
  final List<GameChoice> choices;
  final GameType type;
  final String hint;
  final Map<String, dynamic>? config;

  StoryChallenge({
    required this.id,
    required this.prompt,
    required this.choices,
    required this.type,
    required this.hint,
    this.config,
  });

  factory StoryChallenge.fromJson(Map<String, dynamic> json) {
    return StoryChallenge(
      id: json['id'] ?? '',
      prompt: json['prompt'] ?? '',
      choices:
          (json['choices'] as List?)
              ?.map((c) => GameChoice.fromJson(c))
              .toList() ??
          [],
      type: GameType.values.firstWhere(
        (e) => e.name == json['type'],
        orElse: () => GameType.SUGGESTION,
      ),
      hint: json['hint'] ?? '',
      config: json['config'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'prompt': prompt,
    'choices': choices.map((c) => c.toJson()).toList(),
    'type': type.name,
    'hint': hint,
    'config': config,
  };
}

class Story {
  final String id;
  final String title;
  final List<StoryPage> pages;
  final String coverColor;
  final AgeGroup ageGroup;
  final bool isComplete;
  final Genre genre;
  final String? gamePath;
  final List<String>? gamePaths;

  Story({
    required this.id,
    required this.title,
    required this.pages,
    required this.coverColor,
    required this.ageGroup,
    this.isComplete = false,
    required this.genre,
    this.gamePath,
    this.gamePaths,
  });

  factory Story.fromJson(Map<String, dynamic> json) {
    return Story(
      id: json['id'] ?? '',
      title: json['title'] ?? '',
      pages:
          (json['pages'] as List?)
              ?.map((p) => StoryPage.fromJson(p))
              .toList() ??
          [],
      coverColor: json['coverColor'] ?? '',
      ageGroup: AgeGroup.values.firstWhere((e) => e.name == json['ageGroup']),
      isComplete: json['isComplete'] ?? false,
      genre: Genre.values.firstWhere((e) => e.name == json['genre']),
      gamePath: json['gamePath'],
      gamePaths: (json['gamePaths'] as List?)?.map((e) => e as String).toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'pages': pages.map((p) => p.toJson()).toList(),
    'coverColor': coverColor,
    'ageGroup': ageGroup.name,
    'isComplete': isComplete,
    'genre': genre.name,
    'gamePath': gamePath,
    'gamePaths': gamePaths,
  };
}
