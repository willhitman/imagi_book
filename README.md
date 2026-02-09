# flutter_app

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Lab: Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Cookbook: Useful Flutter samples](https://docs.flutter.dev/cookbook)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.


## Building Games
The app includes HTML5 games for specific stories. To build them:

```bash
./scripts/build_games.sh
```
This script installs dependencies, builds the games, and copies the output to `assets/games/`.

## Configuration

This project uses `flutter_dotenv` to manage environment variables.

1. Create a file named `.env` in the root directory of the project.
2. Add your Gemini API key to the file:

```
API_KEY=your_api_key_here
```

**Note:** The `.env` file is gitignored to protect your API keys. Do not commit it to version control.
 
