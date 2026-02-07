import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/types.dart';

class AdventureGameWidget extends StatefulWidget {
  final GameChallenge challenge;
  final Function(String outcome, String path) onComplete;

  const AdventureGameWidget({
    super.key,
    required this.challenge,
    required this.onComplete,
  });

  @override
  State<AdventureGameWidget> createState() => _AdventureGameWidgetState();
}

class _AdventureGameWidgetState extends State<AdventureGameWidget> {
  GameChoice? selectedChoice;
  bool showOutcome = false;
  int score = 0;
  String gameState = 'IDLE'; // IDLE, PLAYING, FINISHED

  // Game specific state
  List<Map<String, dynamic>> matchingPairs = [];
  List<int> flipped = [];
  int health = 100;
  int runnerPos = 1;
  List<String> scienceElements = [];
  bool isAttacking = false;
  Timer? runnerTimer;

  @override
  void initState() {
    super.initState();
    _initGame();
  }

  @override
  void dispose() {
    runnerTimer?.cancel();
    super.dispose();
  }

  void _initGame() {
    if (widget.challenge.type == GameType.MATCHING) {
      final items = ['💎', '🔑', '⭐', '🌙', '☀️', '🍀'];
      final doubled = [...items, ...items]..shuffle();
      matchingPairs =
          doubled
              .asMap()
              .entries
              .map(
                (e) => {
                  'id': e.key,
                  'val': e.value,
                  'matched': false,
                  'flipped': false,
                },
              )
              .toList();
      setState(() => gameState = 'PLAYING');
    } else if (widget.challenge.type == GameType.RUNNER) {
      setState(() => gameState = 'PLAYING');
      runnerTimer = Timer.periodic(const Duration(milliseconds: 50), (timer) {
        if (mounted) {
          setState(() => score += 5);
          if (score >= 2000) {
            timer.cancel();
            _handleWin();
          }
        }
      });
    } else if (widget.challenge.type == GameType.BATTLE ||
        widget.challenge.type == GameType.SCIENCE ||
        widget.challenge.type == GameType.PUZZLE) {
      setState(() => gameState = 'PLAYING');
    }
  }

  void _handleWin() {
    setState(() => gameState = 'FINISHED');
    final choice =
        widget.challenge.choices.isNotEmpty
            ? widget.challenge.choices[0]
            : GameChoice(
              text: "Success",
              outcome: "You triumphed!",
              path: ChoicePath.CLASSICAL,
            );

    setState(() => selectedChoice = choice);
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted) setState(() => showOutcome = true);
    });
  }

  // Matching
  void _handleFlip(int id) {
    if (flipped.length == 2 ||
        matchingPairs[id]['matched'] ||
        flipped.contains(id))
      return;

    setState(() {
      flipped.add(id);
      matchingPairs[id]['flipped'] = true;
    });

    if (flipped.length == 2) {
      if (matchingPairs[flipped[0]]['val'] ==
          matchingPairs[flipped[1]]['val']) {
        setState(() {
          matchingPairs[flipped[0]]['matched'] = true;
          matchingPairs[flipped[1]]['matched'] = true;
          score += 250;
          flipped.clear();
        });
        if (matchingPairs.every((p) => p['matched'])) _handleWin();
      } else {
        Future.delayed(const Duration(milliseconds: 800), () {
          if (mounted) {
            setState(() {
              matchingPairs[flipped[0]]['flipped'] = false;
              matchingPairs[flipped[1]]['flipped'] = false;
              flipped.clear();
            });
          }
        });
      }
    }
  }

  // Battle
  void _handleAttack() {
    setState(() {
      isAttacking = true;
      health = (health - 15).clamp(0, 100);
      score += 100;
    });
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) setState(() => isAttacking = false);
    });
    if (health <= 15) _handleWin();
  }

  // Science
  void _handleMix(String element) {
    setState(() {
      scienceElements.add(element);
      score += 200;
    });
    if (scienceElements.length >= 3) {
      Future.delayed(const Duration(seconds: 1), _handleWin);
    }
  }

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
          avatar: const Icon(Icons.videogame_asset, color: Colors.amber),
          label: Text(
            "SCORE: $score",
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
        _buildSpecificGame(),
        const SizedBox(height: 32),
        if (widget.challenge.type != GameType.SUGGESTION)
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

  Widget _buildSpecificGame() {
    switch (widget.challenge.type) {
      case GameType.MATCHING:
        return GridView.builder(
          shrinkWrap: true,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
          ),
          itemCount: matchingPairs.length,
          itemBuilder: (ctx, i) {
            final p = matchingPairs[i];
            final show = p['matched'] || p['flipped'];
            return GestureDetector(
              onTap: () => _handleFlip(i),
              child: AnimatedContainer(
                duration: 300.ms,
                decoration: BoxDecoration(
                  color: show ? Colors.white : Colors.orangeAccent,
                  borderRadius: BorderRadius.circular(16),
                  border:
                      show ? Border.all(color: Colors.blue, width: 2) : null,
                ),
                child: Center(
                  child: Text(
                    show ? p['val'] : '?',
                    style: const TextStyle(fontSize: 32),
                  ),
                ),
              ),
            );
          },
        );

      case GameType.RUNNER:
        return Container(
          height: 200,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white, width: 4),
          ),
          child: Row(
            children:
                [0, 1, 2].map((lane) {
                  return Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() => runnerPos = lane),
                      child: Container(
                        decoration: BoxDecoration(
                          border: Border(
                            right: BorderSide(color: Colors.white54),
                          ),
                          color:
                              runnerPos == lane
                                  ? Colors.blue.withOpacity(0.1)
                                  : Colors.transparent,
                        ),
                        alignment: Alignment.bottomCenter,
                        padding: const EdgeInsets.only(bottom: 20),
                        child:
                            runnerPos == lane
                                ? const Text(
                                  "🏃‍♂️",
                                  style: TextStyle(fontSize: 40),
                                ).animate().shake()
                                : null,
                      ),
                    ),
                  );
                }).toList(),
          ),
        );

      case GameType.BATTLE:
        return Column(
          children: [
            Text(
              "👺",
              style: TextStyle(fontSize: 100),
            ).animate(target: isAttacking ? 1 : 0).shake(),
            SizedBox(
              width: 200,
              child: LinearProgressIndicator(
                value: health / 100,
                color: Colors.red,
                backgroundColor: Colors.grey[300],
                minHeight: 10,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton.icon(
                  onPressed: _handleAttack,
                  icon: const Icon(Icons.flash_on),
                  label: const Text("BLAST"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.pink,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.all(20),
                  ),
                ),
                const SizedBox(width: 16),
                ElevatedButton.icon(
                  onPressed: _handleAttack,
                  icon: const Icon(Icons.cloud),
                  label: const Text("ZAP"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.purple,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.all(20),
                  ),
                ),
              ],
            ),
          ],
        );

      case GameType.SCIENCE:
        return Column(
          children: [
            Wrap(
              spacing: 16,
              children:
                  ['🧪', '🧬', '⚛️', '🔥', '🧊', '⚡']
                      .map(
                        (e) => ElevatedButton(
                          onPressed: () => _handleMix(e),
                          child: Text(e, style: const TextStyle(fontSize: 30)),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.all(16),
                          ),
                        ),
                      )
                      .toList(),
            ),
            const SizedBox(height: 24),
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(20),
              ),
              width: double.infinity,
              child: Center(
                child: Text(
                  scienceElements.isEmpty
                      ? "MIX ELEMENTS..."
                      : scienceElements.join(" + "),
                  style: const TextStyle(
                    color: Colors.blueAccent,
                    fontSize: 24,
                    fontFamily: 'Courier',
                  ),
                ),
              ),
            ),
          ],
        );

      case GameType.PUZZLE:
        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          children:
              [1, 2, 3, 4]
                  .map(
                    (i) => GestureDetector(
                      onTap:
                          () => setState(() {
                            score += 250;
                            if (score >= 1000) _handleWin();
                          }),
                      child: Card(
                        color:
                            score >= i * 250
                                ? Colors.greenAccent
                                : Colors.white,
                        child: Center(
                          child: Icon(
                            score >= i * 250 ? Icons.check : Icons.search,
                            size: 40,
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
        );

      case GameType.SUGGESTION:
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
          "CHALLENGE COMPLETE!",
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
          label: const Text("NEXT CHAPTER"),
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
