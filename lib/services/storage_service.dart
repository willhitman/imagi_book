import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/types.dart';

class StorageService {
  static const String _libraryKey =
      'storyspark_library_v2'; // Keeping v2 key for compatibility

  Future<void> saveLibrary(List<Story> stories) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final String jsonString = jsonEncode(
        stories.map((e) => e.toJson()).toList(),
      );
      await prefs.setString(_libraryKey, jsonString);
      debugPrint('StorageService: Library saved (${stories.length} stories).');
    } catch (e) {
      debugPrint('StorageService: Error saving library: $e');
    }
  }

  Future<List<Story>> loadLibrary() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saved = prefs.getString(_libraryKey);
      if (saved != null) {
        final List<dynamic> jsonList = jsonDecode(saved);
        return jsonList.map((e) => Story.fromJson(e)).toList();
      }
    } catch (e) {
      debugPrint('StorageService: Error loading library: $e');
    }
    return [];
  }

  Future<void> clearLibrary() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_libraryKey);
  }
}
