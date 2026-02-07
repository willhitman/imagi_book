import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_app/screens/library_screen.dart';
import 'package:flutter_app/main.dart';

void main() {
  testWidgets('Story Spark smoke test', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(const StorySparkApp(apiKey: 'dummy_key'));

    // Verify that the LibraryScreen is present.
    expect(find.byType(LibraryScreen), findsOneWidget);

    // Check for "4 Classics & 2 Mysterious Adventures"
    expect(find.text('4 Classics & 2 Mysterious Adventures'), findsOneWidget);
  });
}
