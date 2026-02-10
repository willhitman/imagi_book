import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

Future<void> main() async {
  // Read API Key from .env
  final envFile = File('.env');
  if (!envFile.existsSync()) {
    print('Error: .env file not found');
    return;
  }
  final lines = await envFile.readAsLines();
  String? apiKey;
  for (var line in lines) {
    if (line.startsWith('API_KEY=')) {
      apiKey = line.split('=')[1].trim();
      break;
    }
  }

  if (apiKey == null) {
    print('Error: API_KEY not found in .env');
    return;
  }

  print('Using API Key: ${apiKey.substring(0, 5)}...');

  final url = Uri.parse(
    'https://generativelanguage.googleapis.com/v1beta/models?key=$apiKey',
  );

  try {
    final response = await http.get(url);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final models = data['models'] as List;
      print('Available Models:');
      for (var model in models) {
        print('- ${model['name']} (${model['supportedGenerationMethods']})');
      }
    } else {
      print('Error: ${response.statusCode} ${response.body}');
    }
  } catch (e) {
    print('Exception: $e');
  }
}
