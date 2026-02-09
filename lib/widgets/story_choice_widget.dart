import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/types.dart';

class StoryChoiceWidget extends StatefulWidget {
  final StoryChallenge challenge;
  final Function(String outcome, String path) onComplete;

  const StoryChoiceWidget({
    super.key,
    required this.challenge,
    required this.onComplete,
  });

  @override
  State<StoryChoiceWidget> createState() => _StoryChoiceWidgetState();
}

class _StoryChoiceWidgetState extends State<StoryChoiceWidget> {
  GameChoice? selectedChoice;
  bool showOutcome = false;
  String gameState = 'PLAYING'; // IDLE, PLAYING, FINISHED

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(24),
        constraints: const BoxConstraints(maxWidth: 800),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(40),
          border: Border.all(
            color: showOutcome ? Colors.green : Colors.white,
            width: 8,
          ),
          boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 40)],
        ),
        child: showOutcome ? _buildOutcome() : _buildGameContent(),
      ),
    );
  }

  Widget _buildGameContent() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Chip(
          avatar: const Icon(Icons.auto_stories, color: Colors.amber),
          label: Text(
            "MAKE YOUR CHOICE",
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.black87,
          labelStyle: const TextStyle(color: Colors.white),
        ),
        const SizedBox(height: 24),
        Text(
          widget.challenge.prompt,
          textAlign: TextAlign.center,
          style: GoogleFonts.comicNeue(
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 32),
        _buildChoices(),
        const SizedBox(height: 32),
        if (widget.challenge.hint.isNotEmpty)
          Tooltip(
            message: widget.challenge.hint,
            child: Chip(
              label: const Text("Need a Hint?"),
              avatar: const Icon(Icons.lightbulb, size: 16),
            ),
          ),
      ],
    );
  }

  Widget _buildChoices() {
    return Column(
      children:
          widget.challenge.choices
              .map(
                (c) => Padding(
                  padding: const EdgeInsets.only(bottom: 16.0),
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() => selectedChoice = c);
                      Future.delayed(
                        const Duration(milliseconds: 500),
                        () => setState(() => showOutcome = true),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(
                        vertical: 20,
                        horizontal: 32,
                      ),
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black87,
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                        side: const BorderSide(color: Colors.black12),
                      ),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          child: Icon(
                            c.path == ChoicePath.CLASSICAL
                                ? Icons.history
                                : c.path == ChoicePath.SHADOW
                                ? Icons.nights_stay
                                : Icons.auto_fix_high,
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                c.text,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                "${c.path.name} CHOICE",
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Colors.grey,
                                  letterSpacing: 2,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              )
              .toList(),
    );
  }

  Widget _buildOutcome() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const Icon(
          Icons.check_circle,
          size: 80,
          color: Colors.green,
        ).animate().scale(),
        const SizedBox(height: 24),
        Text(
          "CHOICE RECORDED!",
          style: GoogleFonts.comicNeue(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
        const SizedBox(height: 24),
        Text(
          selectedChoice?.outcome ?? "",
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 24, fontStyle: FontStyle.italic),
        ),
        const SizedBox(height: 32),
        ElevatedButton.icon(
          onPressed:
              () => widget.onComplete(
                selectedChoice?.outcome ?? "",
                selectedChoice?.path.name ?? "CLASSICAL",
              ),
          icon: const Icon(Icons.arrow_forward),
          label: const Text("CONTINUE STORY"),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.green,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            textStyle: const TextStyle(fontSize: 20),
          ),
        ),
      ],
    );
  }
}
