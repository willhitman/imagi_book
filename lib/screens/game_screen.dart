import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../theme/design_tokens.dart';

class GameScreen extends StatefulWidget {
  final String gamePath;
  final String title;

  const GameScreen({super.key, required this.gamePath, required this.title});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> {
  late WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  void _initWebView() {
    _controller =
        WebViewController()
          ..setJavaScriptMode(JavaScriptMode.unrestricted)
          ..setBackgroundColor(const Color(0x00000000))
          ..setNavigationDelegate(
            NavigationDelegate(
              onPageStarted: (String url) {
                debugPrint('WebView Page Started: $url');
              },
              onPageFinished: (String url) {
                debugPrint('WebView Page Finished: $url');
                if (mounted) {
                  setState(() {
                    _isLoading = false;
                  });
                }
              },
              onWebResourceError: (WebResourceError error) {
                debugPrint('WebView error: ${error.description}');
              },
              onHttpError: (HttpResponseError error) {
                debugPrint('WebView HTTP error: ${error.response?.statusCode}');
              },
            ),
          )
          // .setOnConsoleMessage is not available in the cross-platform controller API directly in all versions or requires platform specific impl
          // simplifying for now to get it running
          /*
          ..setOnConsoleMessage((ConsoleMessage message) {
            debugPrint('WebView JS: ${message.message}');
          })
          */
          ..addJavaScriptChannel(
            'GameChannel',
            onMessageReceived: (JavaScriptMessage message) {
              debugPrint('GameChannel message: ${message.message}');
              if (message.message == 'GAME_COMPLETE') {
                if (mounted) {
                  Navigator.of(context).pop(true);
                }
              } else if (message.message == 'GAME_QUIT') {
                if (mounted) {
                  Navigator.of(context).pop('quit');
                }
              }
            },
          );

    _loadGame();
  }

  Future<void> _loadGame() async {
    try {
      // Load the HTML content
      String fileText = await rootBundle.loadString(widget.gamePath);

      // Determine base URL for assets
      // This assumes standard Flutter Android asset structure
      // widget.gamePath example: "assets/games/folder/index.html"
      final String directory = widget.gamePath.substring(
        0,
        widget.gamePath.lastIndexOf('/') + 1,
      );

      // Android asset path
      String baseUrl = 'file:///android_asset/flutter_assets/$directory';
      debugPrint('Loading HTML with baseUrl: $baseUrl');

      await _controller.loadHtmlString(fileText, baseUrl: baseUrl);
    } catch (e) {
      debugPrint("Error loading game asset: $e");
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
        // Optionally show alert and pop
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading game: $e')));
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SafeArea(
        child: Stack(
          children: [
            WebViewWidget(controller: _controller),
            if (_isLoading)
              const Center(
                child: CircularProgressIndicator(color: AppColors.kidYellow),
              ),
            // Back button overlay
            Positioned(
              top: 16,
              left: 16,
              child: FloatingActionButton.small(
                backgroundColor: Colors.white.withOpacity(0.8),
                child: const Icon(Icons.arrow_back, color: Colors.black),
                onPressed: () => Navigator.of(context).pop(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
