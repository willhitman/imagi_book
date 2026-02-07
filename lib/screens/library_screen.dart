import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../models/types.dart';
import '../services/gemini_service.dart';
import '../theme/design_tokens.dart'; // Import tokens
import 'story_reader_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  List<Story> stories = [];
  bool isSeeding = false;
  double seedProgress = 0;
  String seedStatus = "";

  final List<Map<String, dynamic>> preDefinedTitles = [
    {
      "title": "Cinderella",
      "age": AgeGroup.KIDS,
      "genre": Genre.FAIRY,
      "color": Colors.pinkAccent,
    },
    {
      "title": "Jack and the Beanstalk",
      "age": AgeGroup.KIDS,
      "genre": Genre.FAIRY,
      "color": Colors.green,
    },
    {
      "title": "The Three Little Pigs",
      "age": AgeGroup.KIDS,
      "genre": Genre.FAIRY,
      "color": Colors.amber,
    },
    {
      "title": "Little Red Riding Hood",
      "age": AgeGroup.KIDS,
      "genre": Genre.FAIRY,
      "color": Colors.blue,
    },
    {
      "title": "The Whispering Vault",
      "age": AgeGroup.TWEENS,
      "genre": Genre.MYSTERY,
      "color": Colors.blueGrey,
    },
    {
      "title": "Project Chimera: Neon Breach",
      "age": AgeGroup.TWEENS,
      "genre": Genre.SCIFI,
      "color": Colors.indigo,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadLibrary();
  }

  Future<void> _loadLibrary() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('storyspark_library_v2');
    if (saved != null) {
      final List<dynamic> jsonList = jsonDecode(saved);
      setState(() {
        stories = jsonList.map((e) => Story.fromJson(e)).toList();
      });
    } else {
      _seedLibrary();
    }
  }

  Future<void> _seedLibrary() async {
    setState(() {
      isSeeding = true;
      seedProgress = 0;
    });

    final newLibrary = <Story>[];
    final geminiService = Provider.of<GeminiService>(context, listen: false);

    try {
      for (int i = 0; i < preDefinedTitles.length; i++) {
        final item = preDefinedTitles[i];
        setState(() {
          seedProgress = (i / preDefinedTitles.length);
          seedStatus = 'Writing "${item["title"]}"...';
        });

        // Generate story text
        // In a real scenario we'd probably want to catch individual failures
        try {
          final pages = await geminiService.generateStorySegment(
            item["title"] as String,
            item["age"] as AgeGroup,
            1,
            5,
          );

          final newStory = Story(
            id: '${DateTime.now().millisecondsSinceEpoch}-$i',
            title: item["title"] as String,
            pages: pages,
            coverColor: (item["color"] as Color).value.toRadixString(
              16,
            ), // Store as hex string or handle differently in model
            ageGroup: item["age"] as AgeGroup,
            isComplete: item["age"] == AgeGroup.KIDS,
            genre: item["genre"] as Genre,
          );
          newLibrary.add(newStory);
        } catch (e) {
          debugPrint('Failed to generate ${item["title"]}: $e');
        }
      }

      setState(() {
        stories = newLibrary;
        seedProgress = 1.0;
        seedStatus = "Library Ready!";
      });

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        'storyspark_library_v2',
        jsonEncode(newLibrary.map((e) => e.toJson()).toList()),
      );

      await Future.delayed(const Duration(seconds: 1));
      setState(() {
        isSeeding = false;
      });
    } catch (error) {
      setState(() {
        seedStatus = "Error building library. Refresh to retry.";
      });
    }
  }

  void _resetLibrary() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('storyspark_library_v2');
    _loadLibrary(); // Reload/reseed
  }

  Color _getColorFromHex(String hexColor) {
    // Trying to parse React's bg styling or stored hex
    // The model logic stored it as hex above, but the React code uses tailwind classes (bg-kid-pink).
    // Since we stored Color.value.toRadixString(16) in _seedLibrary, we can parse it back.
    // But pre-existing library might have tailwind strings if we were migrating data (which we aren't, fresh app).
    // Wait, in _seedLibrary I stored `(item["color"] as Color).value.toRadixString(16)`.
    // So I should parse that.
    try {
      return Color(int.parse(hexColor, radix: 16));
    } catch (e) {
      return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (isSeeding) {
      return Scaffold(
        backgroundColor: const Color(0xFF0F172A), // slate-900
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.auto_stories, size: 80, color: Colors.blueAccent)
                  .animate(onPlay: (c) => c.repeat(reverse: true))
                  .fade(duration: 1.seconds),
              const SizedBox(height: 32),
              const Text(
                "Unlocking Portals",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  fontFamily: 'Comic Neue',
                ),
              ),
              const Text(
                "Writing 6 stories for your offline vault...",
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 16,
                  fontFamily: 'Comic Neue',
                ),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: 300,
                child: LinearProgressIndicator(
                  value: seedProgress,
                  backgroundColor: Colors.blueGrey[800],
                  color: Colors.blueAccent,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                seedStatus,
                style: const TextStyle(
                  color: Colors.amber,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ).animate().fadeIn(),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      body: Stack(
        children: [
          // Parchment background layer
          Container(decoration: AppDecorations.parchmentBackground),
          // Vignette overlay
          Positioned.fill(
            child: IgnorePointer(
              child: Container(decoration: AppDecorations.vignette),
            ),
          ),
          // Content
          SafeArea(
            child: Column(
              children: [
                const SizedBox(height: 24),
                // Header
                RichText(
                  text: TextSpan(
                    style: GoogleFonts.comicNeue(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                    ),
                    children: const [
                      TextSpan(
                        text: 'Story',
                        style: TextStyle(color: AppColors.kidBlue),
                      ),
                      TextSpan(
                        text: 'Spark',
                        style: TextStyle(color: AppColors.kidYellow),
                      ),
                    ],
                  ),
                ),
                Container(
                  margin: const EdgeInsets.symmetric(vertical: 20),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Colors.white.withOpacity(0.5)),
                  ),
                  child: const Text(
                    '4 Classics & 2 Mysterious Adventures',
                    style: TextStyle(
                      color: Colors.black87,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),

                // Grid
                Expanded(
                  child: Theme(
                    data: Theme.of(context).copyWith(
                      scrollbarTheme: ScrollbarThemeData(
                        thumbColor: MaterialStateProperty.all(
                          AppColors.paperLight.withOpacity(0.8),
                        ),
                        trackColor: MaterialStateProperty.all(Colors.black12),
                        thickness: MaterialStateProperty.all(12),
                        radius: const Radius.circular(6),
                      ),
                    ),
                    child: Scrollbar(
                      thumbVisibility: true,
                      child: GridView.builder(
                        padding: const EdgeInsets.all(24),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.75,
                              crossAxisSpacing: 24,
                              mainAxisSpacing: 24,
                            ),
                        itemCount: stories.length,
                        itemBuilder: (ctx, i) {
                          final story = stories[i];
                          return _buildStoryCard(context, story);
                        },
                      ),
                    ),
                  ),
                ),

                // Footer
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: TextButton.icon(
                    onPressed: _resetLibrary,
                    icon: const Icon(Icons.refresh),
                    label: const Text("Reset Vault"),
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.black54,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStoryCard(BuildContext context, Story story) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => StoryReaderScreen(story: story)),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: _getColorFromHex(story.coverColor),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(8),
            bottomLeft: Radius.circular(8),
            topRight: Radius.circular(40),
            bottomRight: Radius.circular(40),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 15,
              offset: const Offset(4, 8),
            ),
          ],
          border: Border(
            right: BorderSide(color: Colors.black.withOpacity(0.1), width: 8),
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              left: 0,
              top: 0,
              bottom: 0,
              width: 20,
              child: Container(color: Colors.black.withOpacity(0.2)),
            ),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Colors.white10,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      story.genre == Genre.SCIFI
                          ? Icons.science
                          : story.genre == Genre.MYSTERY
                          ? Icons.fingerprint
                          : Icons.menu_book,
                      size: 48,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    story.title,
                    textAlign: TextAlign.center,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.comicNeue(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      height: 1.1,
                    ),
                  ),
                ],
              ),
            ),
            if (story.ageGroup == AgeGroup.TWEENS)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    "9+",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ).animate().scale(duration: 300.ms, curve: Curves.easeOutBack),
    );
  }
}
