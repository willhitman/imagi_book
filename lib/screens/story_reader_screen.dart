import 'dart:convert';
import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/types.dart';
import '../services/gemini_service.dart';
import '../services/tts_service.dart';
import '../widgets/adventure_game_widget.dart';
import '../theme/design_tokens.dart';

class StoryReaderScreen extends StatefulWidget {
  final Story story;

  const StoryReaderScreen({super.key, required this.story});

  @override
  State<StoryReaderScreen> createState() => _StoryReaderScreenState();
}

class _StoryReaderScreenState extends State<StoryReaderScreen> {
  late Story story;
  late int currentPageIndex;

  // State
  bool showCover = false;
  bool isPlayingAudio = false;
  bool isRevealed = false;
  bool isFinished = false;
  bool isGeneratingNext = false;
  bool isTeachMode = false;

  // Highlighting
  int? _currentWordIndex;
  StreamSubscription? _ttsSubscription;

  // Gauntlet state (Tweens)
  bool isInGauntlet = false;
  int challengeCount = 0;
  GameChallenge? activeChallenge;
  List<Map<String, String>> challengeOutcomes = [];

  // Services
  late TTSService _ttsService;
  final AudioPlayer _audioPlayer =
      AudioPlayer(); // Keep for legacy/sound effects if needed

  @override
  void initState() {
    super.initState();
    story = widget.story;
    currentPageIndex = 0;
    showCover = story.ageGroup == AgeGroup.TWEENS;

    // Initialize services
    _ttsService = Provider.of<TTSService>(context, listen: false);

    _checkAndGenerateImage();
  }

  @override
  void dispose() {
    _audioPlayer.dispose();
    _ttsService.stop();
    _ttsSubscription?.cancel();
    super.dispose();
  }

  StoryPage get currentPage => story.pages[currentPageIndex];

  void _checkAndGenerateImage() async {
    final shouldGenerateKids =
        story.ageGroup == AgeGroup.KIDS &&
        currentPage.videoUrl == null &&
        !currentPage.isGenerating;

    final shouldGenerateTweens =
        story.ageGroup == AgeGroup.TWEENS &&
        currentPage.videoUrl == null &&
        !currentPage.isGenerating &&
        isRevealed;

    if (shouldGenerateKids || shouldGenerateTweens) {
      if (!mounted) return;
      setState(() {
        story.pages[currentPageIndex].isGenerating = true;
      });

      try {
        final geminiService = Provider.of<GeminiService>(
          context,
          listen: false,
        );
        final imgUrl = await geminiService.generateImage(
          currentPage.imagePrompt,
        );

        if (mounted) {
          setState(() {
            story.pages[currentPageIndex].videoUrl = imgUrl;
            story.pages[currentPageIndex].isGenerating = false;
          });
        }
      } catch (e) {
        if (mounted)
          setState(() => story.pages[currentPageIndex].isGenerating = false);
      }
    }
  }

  void _handleNextPage() async {
    setIsRevealed(false);
    _ttsService.stop();
    setState(() {
      isPlayingAudio = false;
      isTeachMode = false;
    });

    // KIDS Gauntlet trigger (Page 3 / index 2) - Existing logic
    if (currentPageIndex == 2 &&
        story.ageGroup == AgeGroup.KIDS &&
        challengeOutcomes.isEmpty) {
      _startGauntlet();
      return;
    }

    // TWEENS Gauntlet trigger (Page 5 / index 4)
    if (currentPageIndex == 4 &&
        story.ageGroup == AgeGroup.TWEENS &&
        !story.isComplete) {
      debugPrint("Triggering Tween Gauntlet...");
      _startTwinGauntlet();
      return;
    }

    if (currentPageIndex < story.pages.length - 1) {
      setState(() {
        currentPageIndex++;
      });
      _checkAndGenerateImage();
    } else {
      setState(() {
        isFinished = true;
      });
    }
  }

  void _handlePrevPage() {
    if (currentPageIndex > 0) {
      _ttsService.stop();
      setState(() {
        currentPageIndex--;
        isPlayingAudio = false;
        isTeachMode = false;
      });
      setIsRevealed(false);
    }
  }

  void _startGauntlet() async {
    setState(() => isGeneratingNext = true);
    try {
      final gemini = Provider.of<GeminiService>(context, listen: false);
      final challenge = await gemini.generateGameChallenge(
        story.title,
        story.pages[2].text,
        story.ageGroup,
      );
      if (mounted) {
        setState(() {
          activeChallenge = challenge;
          isInGauntlet = true;
          isGeneratingNext = false;
        });
      }
    } catch (e) {
      setState(() => isGeneratingNext = false);
    }
  }

  void _startTwinGauntlet() async {
    setState(() => isInGauntlet = true);
    _nextTweenChallenge();
  }

  void _nextTweenChallenge() async {
    setState(() => isGeneratingNext = true);
    try {
      final gemini = Provider.of<GeminiService>(context, listen: false);
      final summary = story.pages.take(5).map((e) => e.text).join(" ");
      final challenge = await gemini.generatePathChallenge(
        story.title,
        summary,
        challengeCount,
      );
      if (mounted) {
        setState(() {
          activeChallenge = challenge;
          isGeneratingNext = false;
        });
      }
    } catch (e) {
      debugPrint("Error generating Tween challenge: $e");
      setState(() => isGeneratingNext = false);
    }
  }

  void _onChallengeComplete(String outcome, String path) async {
    challengeOutcomes.add({'outcome': outcome, 'path': path});
    setState(() => activeChallenge = null);

    if (story.ageGroup == AgeGroup.KIDS) {
      setState(() {
        isInGauntlet = false;
        if (currentPageIndex < story.pages.length - 1) currentPageIndex++;
      });
      _checkAndGenerateImage();
      return;
    }

    // TWEENS Logic
    if (challengeCount < 4) {
      setState(() => challengeCount++);
      _nextTweenChallenge();
    } else {
      // Finish gauntlet
      setState(() => isGeneratingNext = true);
      try {
        final gemini = Provider.of<GeminiService>(context, listen: false);
        final contextStr =
            "Chosen path events: ${challengeOutcomes.map((e) => e['outcome']).join('. ')}";
        final finalPages = await gemini.generateStorySegment(
          story.title,
          story.ageGroup,
          6,
          5,
          previousContext: contextStr,
        );

        if (mounted) {
          setState(() {
            final newPages = List<StoryPage>.from(story.pages)
              ..addAll(finalPages);
            story = Story(
              id: story.id,
              title: story.title,
              pages: newPages,
              coverColor: story.coverColor,
              ageGroup: story.ageGroup,
              genre: story.genre,
              isComplete: true,
            );
            isInGauntlet = false;
            currentPageIndex = 5;
            isGeneratingNext = false;
          });
          _checkAndGenerateImage();
        }
      } catch (e) {
        setState(() => isGeneratingNext = false);
      }
    }
  }

  Future<bool> _checkConnectivity() async {
    final connectivityResult = await Connectivity().checkConnectivity();
    return !connectivityResult.contains(ConnectivityResult.none);
  }

  void _toggleAudio() async {
    if (isPlayingAudio) {
      await _ttsService.stop();
      _ttsSubscription?.cancel();
      _ttsSubscription = null;
      setState(() {
        isPlayingAudio = false;
        _currentWordIndex = null;
      });
      return;
    }

    setState(() {
      isPlayingAudio = true;
      isTeachMode = false; // Disable teach mode when reading full page
      _currentWordIndex = null;
    });

    final hasInternet = await _checkConnectivity();

    // Attempt Gemini Audio if online (Placeholder for future API support)
    if (hasInternet) {
      // In a real implementation:
      // final audioBytes = await GeminiService.generateSpeech(currentPage.text);
      // if (audioBytes != null) playAudio(bytes); return;
      // For now, generateSpeech returns null, so we fall back directly.
    }

    final text = currentPage.text;
    final words = text.split(' ');
    int currentChar = 0;
    final wordStarts = <int>[];
    for (final word in words) {
      wordStarts.add(currentChar);
      currentChar += word.length + 1; // +1 for space (approximate)
    }

    _ttsSubscription = _ttsService.currentWordStartStream.listen((start) {
      int index = 0;
      for (int i = 0; i < wordStarts.length; i++) {
        if (start >= wordStarts[i]) {
          index = i;
        } else {
          break;
        }
      }
      if (mounted && index != _currentWordIndex) {
        setState(() => _currentWordIndex = index);
      }
    });

    await _ttsService.speak(currentPage.text);
  }

  void setIsRevealed(bool val) {
    if (val &&
        !isRevealed &&
        currentPage.videoUrl == null &&
        !currentPage.isGenerating) {
      _checkAndGenerateImage();
    }
    setState(() => isRevealed = val);
  }

  @override
  Widget build(BuildContext context) {
    if (isFinished) return _buildFinished();
    if (showCover) return _buildCover();

    // Workflow Split
    if (story.ageGroup == AgeGroup.KIDS) {
      return _buildKidsReader();
    } else {
      return _buildTweensReader(); // Existing logic
    }
  }

  // --- KIDS READER (New Imagitest Style) ---
  Widget _buildKidsReader() {
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: Stack(
        children: [
          Container(decoration: AppDecorations.parchmentBackground),
          SafeArea(
            child: Column(
              children: [
                // Header
                _buildKidsHeader(),

                Expanded(
                  child: Column(
                    children: [
                      // Image Section (30% height)
                      SizedBox(
                        height: MediaQuery.of(context).size.height * 0.3,
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: _buildVisualContainer(),
                        ),
                      ),

                      const SizedBox(height: 16),

                      // Action Buttons (Centered)
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16.0),
                        child: _buildActionButtons(),
                      ),

                      const SizedBox(height: 16),

                      // Text Section (Fills remaining space)
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.9),
                              borderRadius: BorderRadius.circular(30),
                              border: Border.all(
                                color:
                                    isTeachMode
                                        ? AppColors.kidPurple
                                        : AppColors.kidBlue,
                                width: isTeachMode ? 4 : 2,
                              ),
                            ),
                            child: SingleChildScrollView(
                              child: _buildInteractiveText(),
                            ),
                          ),
                        ),
                      ),

                      if (isTeachMode)
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8.0),
                          child: Text(
                                "Slide your finger to read!",
                                style: GoogleFonts.comicNeue(
                                  color: AppColors.kidPurple,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                              )
                              .animate(onPlay: (c) => c.repeat())
                              .shimmer(
                                duration: 2.seconds,
                                color: Colors.purpleAccent,
                              ),
                        ),
                    ],
                  ),
                ),

                // Footer Controls
                _buildKidsFooter(),
              ],
            ),
          ),
          if (isGeneratingNext)
            Container(
              color: Colors.black45,
              child: const Center(child: CircularProgressIndicator()),
            ),
          if (isInGauntlet && activeChallenge != null)
            Container(
              color: AppColors.paper,
              child: AdventureGameWidget(
                challenge: activeChallenge!,
                onComplete: _onChallengeComplete,
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildKidsHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          FloatingActionButton.small(
            heroTag: "home_btn",
            backgroundColor: Colors.white,
            foregroundColor: Colors.grey,
            onPressed: () => Navigator.pop(context),
            child: const Icon(Icons.home),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.8),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white),
            ),
            child: Text(
              story.title,
              style: GoogleFonts.comicNeue(
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
          ),
          FloatingActionButton.small(
            heroTag: "settings_btn",
            backgroundColor: AppColors.kidYellow,
            foregroundColor: Colors.white,
            onPressed: _showSettingsDialog,
            child: const Icon(Icons.settings),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      // gap: 16, // This property is not available in Row, use SizedBox
      children: [
        ElevatedButton.icon(
          onPressed: _toggleAudio,
          icon: Icon(isPlayingAudio ? Icons.stop : Icons.volume_up),
          label: Text(isPlayingAudio ? "Stop" : "Read to Me"),
          style: ElevatedButton.styleFrom(
            backgroundColor:
                isPlayingAudio ? AppColors.kidPink : AppColors.kidGreen,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            textStyle: GoogleFonts.comicNeue(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        const SizedBox(width: 16), // Replaces gap
        ElevatedButton.icon(
          onPressed: () {
            _ttsService.stop();
            setState(() {
              isPlayingAudio = false;
              isTeachMode = !isTeachMode;
            });
          },
          icon: const Icon(Icons.touch_app),
          label: Text(isTeachMode ? "Teaching..." : "Teach"),
          style: ElevatedButton.styleFrom(
            backgroundColor: isTeachMode ? AppColors.kidPurple : Colors.white,
            foregroundColor: isTeachMode ? Colors.white : AppColors.kidPurple,
            side: const BorderSide(color: AppColors.kidPurple, width: 2),
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            textStyle: GoogleFonts.comicNeue(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  // Add state for gliding
  final List<GlobalKey> _wordKeys = [];
  int? _lastSpokenIndex;

  Widget _buildInteractiveText() {
    final simpleWords = currentPage.text.split(' ');

    // Regenerate keys if needed (simple check, optimal would be diffing)
    if (_wordKeys.length != simpleWords.length) {
      _wordKeys.clear();
      for (var i = 0; i < simpleWords.length; i++) {
        _wordKeys.add(GlobalKey());
      }
    }

    return GestureDetector(
      onPanUpdate: (details) => _handleGlide(details.globalPosition),
      onPanStart: (details) => _handleGlide(details.globalPosition),
      child: Wrap(
        spacing: 6,
        runSpacing: 8,
        children: List.generate(simpleWords.length, (index) {
          final word = simpleWords[index];
          final cleanWord = word.replaceAll(RegExp(r'[^\w\s]'), '');
          return GestureDetector(
            key: _wordKeys[index],
            onTap: () {
              if (isTeachMode) _speakWord(cleanWord);
            },
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color:
                    isTeachMode
                        ? Colors.purple.withOpacity(0.05)
                        : (index == _currentWordIndex
                            ? AppColors.kidPink.withOpacity(0.2)
                            : Colors.transparent),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                word,
                style: GoogleFonts.comicNeue(
                  fontSize: 32,
                  height: 1.5,
                  color:
                      index == _currentWordIndex
                          ? AppColors.kidPink
                          : Colors.black87,
                  fontWeight: isTeachMode ? FontWeight.w600 : FontWeight.normal,
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  void _handleGlide(Offset globalPosition) {
    if (!isTeachMode) return;

    for (int i = 0; i < _wordKeys.length; i++) {
      final key = _wordKeys[i];
      final context = key.currentContext;
      if (context != null) {
        final box = context.findRenderObject() as RenderBox;
        final localPosition = box.globalToLocal(globalPosition);
        if (box.paintBounds.contains(localPosition)) {
          if (_lastSpokenIndex != i) {
            final simpleWords = currentPage.text.split(' ');
            final word = simpleWords[i].replaceAll(RegExp(r'[^\w\s]'), '');
            _speakWord(word);
            _lastSpokenIndex = i;
          }
          break;
        }
      }
    }
  }

  void _speakWord(String word) async {
    // For Kids: Just speak the word immediately for reinforcement
    await _ttsService.speak(word);
  }

  Widget _buildKidsFooter() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          FloatingActionButton.extended(
            heroTag: "prev_btn",
            onPressed: currentPageIndex == 0 ? null : _handlePrevPage,
            label: const Text("Prev"),
            icon: const Icon(Icons.arrow_back),
            backgroundColor: Colors.white,
            foregroundColor: AppColors.kidBlue,
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white60,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Text(
              "${currentPageIndex + 1} / ${story.pages.length}",
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          FloatingActionButton.extended(
            heroTag: "next_btn",
            onPressed:
                currentPageIndex == story.pages.length - 1
                    ? null
                    : _handleNextPage,
            label: const Text("Next"),
            icon: const Icon(Icons.arrow_forward),
            backgroundColor: AppColors.kidBlue,
            foregroundColor: Colors.white,
          ),
        ],
      ),
    );
  }

  Widget _buildVisualContainer() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [BoxShadow(blurRadius: 10, color: Colors.black12)],
      ),
      clipBehavior: Clip.antiAlias,
      child:
          currentPage.isGenerating
              ? const Center(child: CircularProgressIndicator())
              : currentPage.videoUrl != null
              ? currentPage.videoUrl!.startsWith('data:')
                  ? Image.memory(
                    base64Decode(currentPage.videoUrl!.split(',')[1]),
                    fit: BoxFit.cover,
                    errorBuilder:
                        (context, error, stackTrace) => const Center(
                          child: Icon(Icons.broken_image, size: 40),
                        ),
                  )
                  : Image.network(
                    currentPage.videoUrl!,
                    fit: BoxFit.cover,
                    errorBuilder:
                        (context, error, stackTrace) => const Center(
                          child: Icon(Icons.broken_image, size: 40),
                        ),
                  )
              : const Center(
                child: Icon(Icons.auto_stories, size: 60, color: Colors.grey),
              ),
    );
  }

  void _showSettingsDialog() {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text(
              "Voice Settings",
              style: GoogleFonts.comicNeue(fontWeight: FontWeight.bold),
            ),
            content: StatefulBuilder(
              builder: (context, setDialogState) {
                return Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text("Speed"),
                    Slider(
                      value: _ttsService.rate,
                      min: 0.1,
                      max: 1.0,
                      onChanged: (val) {
                        setDialogState(() => _ttsService.rate = val);
                        _ttsService.setRate(val);
                      },
                    ),
                    const Text("Pitch"),
                    Slider(
                      value: _ttsService.pitch,
                      min: 0.5,
                      max: 2.0,
                      onChanged: (val) {
                        setDialogState(() => _ttsService.pitch = val);
                        _ttsService.setPitch(val);
                      },
                    ),
                    ElevatedButton(
                      onPressed: () => _ttsService.speak("Hello adventurer!"),
                      child: const Text("Test Voice"),
                    ),
                  ],
                );
              },
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Close"),
              ),
            ],
          ),
    );
  }

  // --- TWEENS READER (Legacy/Existing Logic) ---
  Widget _buildTweensReader() {
    // Re-using the previous logic but adapting to the new state variables
    return Scaffold(
      backgroundColor: AppColors.paper,
      body: Stack(
        children: [
          Container(decoration: AppDecorations.parchmentBackground),
          SafeArea(
            child: Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 8,
                  ),
                  color: Colors.white.withOpacity(0.9), // Slightly transparent
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.home),
                        onPressed: () => Navigator.pop(context),
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              story.title,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            LinearProgressIndicator(
                              value:
                                  (currentPageIndex + 1) / story.pages.length,
                              minHeight: 4,
                              borderRadius: BorderRadius.circular(2),
                              color: AppColors.kidBlue,
                              backgroundColor: Colors.grey[300],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.settings),
                        onPressed: _showSettingsDialog,
                      ),
                    ],
                  ),
                ),

                Expanded(
                  child:
                      isGeneratingNext
                          ? const Center(child: CircularProgressIndicator())
                          : isInGauntlet && activeChallenge != null
                          ? AdventureGameWidget(
                            challenge: activeChallenge!,
                            onComplete: _onChallengeComplete,
                          )
                          : _buildTweensContent(),
                ),

                if (!isInGauntlet && !isGeneratingNext)
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: Colors.white.withOpacity(0.9),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        TextButton.icon(
                          onPressed:
                              currentPageIndex == 0 ? null : _handlePrevPage,
                          icon: const Icon(Icons.arrow_back),
                          label: const Text("Back"),
                        ),
                        Text(
                          "PAGE ${currentPageIndex + 1} / ${story.pages.length}",
                          style: const TextStyle(color: Colors.grey),
                        ),
                        ElevatedButton.icon(
                          onPressed: _handleNextPage,
                          icon: const Icon(Icons.arrow_forward),
                          label: Text(
                            currentPageIndex == story.pages.length - 1
                                ? 'Finish'
                                : 'Next',
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.kidBlue,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTweensContent() {
    return Row(
      children: [
        Expanded(
          flex: 1,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Chapter ${currentPageIndex + 1}",
                      style: const TextStyle(
                        color: Colors.grey,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: Icon(
                            isPlayingAudio
                                ? Icons.volume_up
                                : Icons.volume_mute,
                          ),
                          onPressed: _toggleAudio,
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton.icon(
                          onPressed: () => setIsRevealed(!isRevealed),
                          icon: Icon(
                            isRevealed
                                ? Icons.visibility
                                : Icons.visibility_off,
                          ),
                          label: Text(isRevealed ? "REVEALED" : "REVEAL"),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // NEW: Interactive Text for Tweens (similar to Kids but different styling)
                _buildInteractiveTweenText(),

                if (isRevealed) ...[
                  const SizedBox(height: 24),
                  AspectRatio(
                    aspectRatio: 16 / 9,
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(blurRadius: 8, color: Colors.black26),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child:
                          currentPage.isGenerating
                              ? const Center(child: CircularProgressIndicator())
                              : currentPage.videoUrl != null
                              ? currentPage.videoUrl!.startsWith('data:')
                                  ? Image.memory(
                                    base64Decode(
                                      currentPage.videoUrl!.split(',')[1],
                                    ),
                                    fit: BoxFit.cover,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            const Center(
                                              child: Icon(
                                                Icons.broken_image,
                                                color: Colors.white,
                                              ),
                                            ),
                                  )
                                  : Image.network(
                                    currentPage.videoUrl!,
                                    fit: BoxFit.cover,
                                    errorBuilder:
                                        (context, error, stackTrace) =>
                                            const Center(
                                              child: Icon(
                                                Icons.broken_image,
                                                color: Colors.white,
                                              ),
                                            ),
                                  )
                              : const Center(
                                child: Icon(
                                  Icons.image_not_supported,
                                  color: Colors.white,
                                ),
                              ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFinished() {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.check_circle, size: 80, color: Colors.green),
            const SizedBox(height: 24),
            Text(
              "Adventure Ended!",
              style: GoogleFonts.comicNeue(
                fontSize: 48,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 48),
            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.book),
              label: const Text("Close Book"),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(
                  horizontal: 40,
                  vertical: 20,
                ),
                textStyle: const TextStyle(fontSize: 24),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCover() {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 200,
              height: 300,
              decoration: BoxDecoration(
                color: Colors.indigo,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: const Icon(
                Icons.dangerous,
                size: 80,
                color: Colors.white54,
              ),
            ).animate().rotate(alignment: Alignment.center),
            const SizedBox(height: 32),
            Text(
              story.title,
              style: GoogleFonts.comicNeue(
                fontSize: 40,
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            const Text(
              "A MATURE ADVENTURE (9+)",
              style: TextStyle(color: Colors.grey, letterSpacing: 2),
            ),
            const SizedBox(height: 48),
            ElevatedButton(
              onPressed: () => setState(() => showCover = false),
              child: const Text("ENTER REALM"),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInteractiveTweenText() {
    final words = currentPage.text.split(' ');

    return Wrap(
      spacing: 4,
      runSpacing: 4,
      children:
          words.map((word) {
            final cleanWord = word.replaceAll(RegExp(r'[^\w\s]'), '');
            return GestureDetector(
              onTap: () => _handleTweenWordTap(cleanWord),
              child: Text(
                word,
                style: GoogleFonts.comicNeue(
                  fontSize: 24,
                  height: 1.5,
                  color: Colors.black87,
                ),
              ),
            );
          }).toList(),
    );
  }

  void _handleTweenWordTap(String word) async {
    final hasInternet = await _checkConnectivity();
    if (!hasInternet) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Connect to internet for definitions!")),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      final gemini = Provider.of<GeminiService>(context, listen: false);
      final definitionData = await gemini.defineWord(
        word,
        currentPage.text,
        story.ageGroup,
      );

      if (mounted) {
        Navigator.pop(context); // Close loader
        if (definitionData != null) {
          _showDefinitionDialog(word, definitionData);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text("Could not define word.")),
          );
        }
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
    }
  }

  void _showDefinitionDialog(String word, Map<String, String> data) {
    showDialog(
      context: context,
      builder:
          (context) => AlertDialog(
            title: Text(
              word,
              style: GoogleFonts.comicNeue(fontWeight: FontWeight.bold),
            ),
            content: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildDefSection("Definition", data["definition"]!),
                  const SizedBox(height: 12),
                  _buildDefSection("Story Context", data["context_meaning"]!),
                  const SizedBox(height: 12),
                  _buildDefSection("Real World", data["real_world_example"]!),
                ],
              ),
            ),
            actions: [
              TextButton.icon(
                onPressed: () {
                  // Speak the full definition
                  final textToSpeak =
                      "${data['definition']} ${data['context_meaning']}";
                  _ttsService.speak(textToSpeak);
                },
                icon: const Icon(Icons.volume_up),
                label: const Text("Listen"),
              ),
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text("Close"),
              ),
            ],
          ),
    );
  }

  Widget _buildDefSection(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.indigo,
          ),
        ),
        Text(content, style: const TextStyle(fontSize: 16)),
      ],
    );
  }
}
