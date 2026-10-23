# App Demo Video

Turn a web app's code repository into a polished demo video with Claude Code.

Claude scans your repo, drafts the pitch for you to edit, asks a few questions in one message (format, how to run the app, test login, call to action, audio), runs the app, captures screenshots and screen recordings of the features you pick, and renders an MP4 with zooms, cursor, callouts, music and an optional free offline AI voiceover with subtitles. Landscape (16:9) or portrait (9:16).

## Use

Open Claude Code in your web app's folder and say *"Make a demo video of this app"*, or run `/app-demo-video:app-demo-video`.

## Requirements

- Node.js 18+ (the video engine and a browser install on first use)
- Optional: Python 3 for the AI voiceover, ffmpeg
- Web apps only in v1

## Safety

Your repo is never modified, `.env` files are never read, and only test accounts and demo data are filmed. The voiceover runs offline on your machine.

More: [main README](../../README.md). Licence: MIT. Remotion, the video engine, has its own licence: free for individuals and companies with up to 3 employees.
