import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'
    show rootBundle; // Added for asset loading
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/storage_service.dart';

import 'package:flutter_animate/flutter_animate.dart'; // Re-added
import '../models/types.dart';
import '../services/gemini_service.dart';
import '../theme/design_tokens.dart';
import 'story_reader_screen.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen> {
  List<Story> stories = [];
  bool isCreating = false;
  final StorageService _storageService = StorageService();

  @override
  void initState() {
    super.initState();
    _loadLibrary();
  }

  Future<void> _loadLibrary() async {
    final loadedStories = await _storageService.loadLibrary();
    if (loadedStories.isNotEmpty) {
      setState(() {
        stories = loadedStories;
      });
    } else {
      _loadDefaultStories();
    }
  }

  Future<void> _loadDefaultStories() async {
    try {
      final String jsonString = await rootBundle.loadString(
        'assets/default_stories/stories.json',
      );
      final List<dynamic> jsonList = jsonDecode(jsonString);
      final defaultStories = jsonList.map((e) => Story.fromJson(e)).toList();

      setState(() {
        stories = defaultStories;
      });

      _saveLibrary(defaultStories);
    } catch (e) {
      debugPrint("Error loading default stories: $e");
    }
  }

  Future<void> _saveLibrary(List<Story> newLibrary) async {
    await _storageService.saveLibrary(newLibrary);
  }

  void _resetLibrary() async {
    await _storageService.clearLibrary();
    _loadLibrary();
  }

  Color _getColorFromHex(String hexColor) {
    try {
      // Handle "FFFF4081" (no 0x) or "0xFFFF4081"
      String cleanHex = hexColor.replaceAll("0x", "");
      if (cleanHex.length == 6) {
        cleanHex = "FF$cleanHex";
      }
      return Color(int.parse(cleanHex, radix: 16));
    } catch (e) {
      return Colors.grey;
    }
  }

  void _showCreateDialog() {
    final titleController = TextEditingController();
    AgeGroup selectedAge = AgeGroup.KIDS;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return Dialog(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      "New Adventure",
                      style: GoogleFonts.comicNeue(
                        fontWeight: FontWeight.bold,
                        fontSize: 24,
                      ),
                    ),
                    const SizedBox(height: 20),
                    TextField(
                      controller: titleController,
                      decoration: const InputDecoration(
                        labelText: "What's the story about?",
                        hintText: "e.g., A magical robot cat",
                        border: OutlineInputBorder(),
                        contentPadding: EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Fixed the Row overflow issue
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "For:",
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[700],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            ChoiceChip(
                              label: const Text("Kids (5-8)"),
                              selected: selectedAge == AgeGroup.KIDS,
                              onSelected: (b) {
                                if (b) {
                                  setDialogState(
                                        () => selectedAge = AgeGroup.KIDS,
                                  );
                                }
                              },
                            ),
                            ChoiceChip(
                              label: const Text("Tweens (9+)"),
                              selected: selectedAge == AgeGroup.TWEENS,
                              onSelected: (b) {
                                if (b) {
                                  setDialogState(
                                        () => selectedAge = AgeGroup.TWEENS,
                                  );
                                }
                              },
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: const Text("Cancel"),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {
                            if (titleController.text.trim().isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text(
                                      "Please enter a story description"),
                                ),
                              );
                              return;
                            }
                            Navigator.pop(ctx);
                            _generateNewStory(
                              titleController.text.trim(),
                              selectedAge,
                            );
                          },
                          child: const Text("Create!"),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Future<void> _generateNewStory(String title, AgeGroup ageGroup) async {
    if (title.isEmpty) return;

    setState(() {
      isCreating = true;
    });

    try {
      final geminiService = Provider.of<GeminiService>(context, listen: false);
      final count =
      ageGroup == AgeGroup.KIDS ? 8 : 12; // 8 for Kids, 12 for Tweens
      final pages = await geminiService.generateStorySegment(
        title,
        ageGroup,
        1,
        count,
      );

      final newStory = Story(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: title,
        pages: pages,
        // Assign a random color
        coverColor: Colors
            .primaries[stories.length % Colors.primaries.length]
            .value
            .toRadixString(16),
        ageGroup: ageGroup,
        isComplete: ageGroup == AgeGroup.TWEENS,
        genre: ageGroup == AgeGroup.TWEENS
            ? Genre.SCIFI
            : Genre.FAIRY, // Basic guesstimate
      );

      final newLibrary = [...stories, newStory];
      setState(() {
        stories = newLibrary;
        isCreating = false;
      });

      _saveLibrary(newLibrary);
    } catch (e) {
      debugPrint("Generation failed: $e");
      setState(() {
        isCreating = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Failed to create story: $e")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Parchment background
          Container(decoration: AppDecorations.parchmentBackground),
          // Vignette
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
                        text: 'Imagi',
                        style: TextStyle(color: AppColors.kidBlue),
                      ),
                      TextSpan(
                        text: 'Book',
                        style: TextStyle(color: AppColors.kidYellow),
                      ),
                    ],
                  ),
                ),

                // Library Grid
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
                        // +1 for the "Create New" button
                        itemCount: stories.length + 1,
                        itemBuilder: (ctx, i) {
                          if (i < stories.length) {
                            final story = stories[i];
                            return _buildStoryCard(context, story);
                          } else {
                            return _buildCreateCard(context);
                          }
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

  Widget _buildCreateCard(BuildContext context) {
    return GestureDetector(
      onTap: isCreating ? null : _showCreateDialog,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.3),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: Colors.blueAccent.withOpacity(0.5),
            width: 3,
          ),
        ),
        child: isCreating
            ? const Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text(
                "Weaving Magic...",
                style: TextStyle(
                  fontFamily: 'Comic Neue',
                  color: Colors.black54,
                ),
              ),
            ],
          ),
        )
            : Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.5),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.auto_awesome,
                size: 48,
                color: Colors.amber,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              "New Enchanted Tale",
              textAlign: TextAlign.center,
              style: GoogleFonts.comicNeue(
                color: Colors.black87,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ).animate().scale(
        duration: 300.ms,
        curve: Curves.easeOutBack,
        delay: 100.ms,
      ),
    );
  }
}