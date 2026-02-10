import 'dart:io';
import 'dart:convert';
import 'package:path_provider/path_provider.dart';
import 'package:flutter/foundation.dart';

class ImageCacheService {
  Future<String> _getDirectoryPath() async {
    final directory = await getApplicationDocumentsDirectory();
    final imagesDir = Directory('${directory.path}/story_images');
    if (!await imagesDir.exists()) {
      await imagesDir.create(recursive: true);
    }
    return imagesDir.path;
  }

  String _getFileName(String storyId, int pageIndex) {
    // Sanitize storyId just in case, though usually it's a timestamp or UUID
    final safeId = storyId.replaceAll(RegExp(r'[^\w\-]'), '_');
    return 'img_${safeId}_$pageIndex.jpg';
  }

  Future<String?> saveImage(
    String base64Data,
    String storyId,
    int pageIndex,
  ) async {
    try {
      final dirPath = await _getDirectoryPath();
      final fileName = _getFileName(storyId, pageIndex);
      final filePath = '$dirPath/$fileName';
      final file = File(filePath);

      // Remove "data:image/jpeg;base64," prefix if present
      String cleanBase64 = base64Data;
      if (cleanBase64.contains(',')) {
        cleanBase64 = cleanBase64.split(',')[1];
      }

      final bytes = base64Decode(cleanBase64);
      await file.writeAsBytes(bytes);

      debugPrint('ImageCacheService: Saved image to $filePath');
      return filePath;
    } catch (e) {
      debugPrint('ImageCacheService: Error saving image: $e');
      return null;
    }
  }

  Future<String?> getImagePath(String storyId, int pageIndex) async {
    try {
      final dirPath = await _getDirectoryPath();
      final fileName = _getFileName(storyId, pageIndex);
      final filePath = '$dirPath/$fileName';
      final file = File(filePath);

      if (await file.exists()) {
        debugPrint('ImageCacheService: Found cached image at $filePath');
        return filePath;
      }
    } catch (e) {
      debugPrint('ImageCacheService: Error checking image path: $e');
    }
    return null;
  }

  Future<void> clearCache() async {
    try {
      final dirPath = await _getDirectoryPath();
      final dir = Directory(dirPath);
      if (await dir.exists()) {
        await dir.delete(recursive: true);
      }
    } catch (e) {
      debugPrint('ImageCacheService: Error clearing cache: $e');
    }
  }
}
