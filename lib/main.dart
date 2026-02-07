import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart'; // Import dotenv
import 'services/gemini_service.dart';
import 'services/tts_service.dart'; // Added import
import 'screens/library_screen.dart';
import 'theme/design_tokens.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await dotenv.load(fileName: ".env");
  } catch (e) {
    debugPrint("Warning: .env file not found.");
  }

  // Get API key from env or use default (from --dart-define)
  final apiKey =
      dotenv.env['API_KEY'] ??
      const String.fromEnvironment('API_KEY', defaultValue: '');

  if (apiKey.isEmpty) {
    debugPrint('Warning: No API_KEY found in .env or environment variables.');
  }

  runApp(StorySparkApp(apiKey: apiKey));
}

class StorySparkApp extends StatelessWidget {
  final String apiKey;

  const StorySparkApp({super.key, required this.apiKey});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider(create: (_) => GeminiService(apiKey)),
        Provider(create: (_) => TTSService()),
      ],
      child: MaterialApp(
        title: 'Story Spark',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.kidBlue,
            primary: AppColors.kidBlue,
            secondary: AppColors.kidYellow,
            background: AppColors.paper,
            surface: AppColors.paper,
          ),
          useMaterial3: true,
          scaffoldBackgroundColor: AppColors.paper,
          textTheme: GoogleFonts.comicNeueTextTheme().apply(
            bodyColor: Colors.black87,
            displayColor: Colors.black87,
          ),
        ),
        home: const LibraryScreen(),
      ),
    );
  }
}
