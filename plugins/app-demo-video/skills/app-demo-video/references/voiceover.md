# Voiceover

Three audio modes. The developer picks one in the upfront questions (see "Choosing the audio" in SKILL.md).

1. **Music + sound effects only** (default). Nothing to do.
2. **Free offline AI voice + subtitles.** This file.
3. **Their own recorded voice.** See the end of this file.

## AI voice: how it works

`scripts/voiceover.py` reads the brief, speaks every scene's `"say"` line with a local voice model (sherpa-onnx running a Piper voice: no account, no API key, nothing leaves the machine), saves one audio file per scene in `public/assets/vo/`, measures it, and writes `voice` + `voiceSeconds` into the scene. The video engine then:
- starts each line 0.25 s into its scene and makes the scene at least as long as the line (+0.45 s),
- lowers the music to ~30% while someone is speaking,
- shows subtitles (turn off with `"audio": {"subtitles": false}`),
- leaves extra room at the bottom of every scene so subtitles never cover content.

Setup and run (from the workspace):

```bash
python3 -m venv .venv && .venv/bin/pip install sherpa-onnx numpy     # once; Windows: .venv\Scripts\pip install ...
.venv/bin/python scripts/voiceover.py --samples                       # optional: out/voice-sample-norman.wav, -cori.wav
.venv/bin/python scripts/voiceover.py briefs/<app>.json               # generates/updates all lines
```

The first run downloads the chosen voice (~65 MB) from the sherpa-onnx GitHub releases into `~/.cache/app-demo-video/voices/`. Lines are cached by text, so re-running after editing one line only regenerates that line. `--force` regenerates all.

Brief settings:

```jsonc
"audio": {
  "voice": { "name": "norman", "speed": 1.0 },   // "norman" = US male, "cori" = UK female; speed 0.9–1.15
  "pronounce": { "Ledgerly": "Ledger lee", "SQL": "sequel", "OAuth": "oh auth" },
  "subtitles": true
}
```

## Writing the spoken lines (`"say"`)

- **One line per scene, ~2.4 words per second of scene.** Hook: 5–9 words. Feature: 10–18 words. CTA: 6–10 words. Total for a 45 s video: about 90–110 words.
- **Complement the screen, don't read it.** On-screen title "Bill a client in *30 seconds*" → say "Pick a client, add your hours, and the invoice writes itself."
- **Talk like a person.** Short sentences, contractions, "you". No marketing filler ("revolutionary", "seamless", "leverage").
- **Write for the ear.** Spell out what's ambiguous: version numbers, abbreviations, unusual brand names (or add them to `pronounce`). The script already converts common things: "fixture.io" → "fixture dot io", "50%" → "50 percent", "₦4,500" / "$20" → "4,500 naira" / "20 dollars", "&" → "and", "3x" → "3 times".
- **Not every scene needs a line.** Leave quick scenes (montage, a second hook beat) silent so the music breathes.
- **Same honesty rules as the on-screen text.** Nothing spoken that isn't true or isn't shown.

After generating, read the printed table: if a line runs much longer than the scene was meant to be, shorten the line rather than letting the video drag. If a word sounds wrong, add it to `pronounce` and re-run.

## Voices offered (and why only these)

| name | voice | license |
|---|---|---|
| norman | US English, male | MIT; trained from scratch on public-domain LibriVox audio |
| cori | UK English, female | MIT; trained from scratch on public-domain LibriVox audio |

Most other Piper voices are unsafe for commercial videos: Lessac, Ryan, HFC and Semaine voices are non-commercial, and many voices with permissive cards were fine-tuned from Lessac, which leaves their status unclear. Don't add voices to `VOICES` in the script without checking the model card says "trained from scratch" with a commercial-friendly license.

Be honest with the developer: these voices are clear and pleasant but recognisably synthetic. For a premium launch video, their own voice or a paid voice service will sound more natural.

## Their own recorded voice

1. Write the `say` lines as above and send them as a script.
2. They record each line as a separate file (phone voice memo is fine, quiet room) named `scene-01.m4a`, `scene-02.m4a`, …
3. Convert and clean each: `ffmpeg -i scene-01.m4a -af "highpass=f=80,loudnorm=I=-16:TP=-1.5" -ar 44100 public/assets/vo/scene-01.wav`
4. In each scene set `"voice": "assets/vo/scene-01.wav"` and `"voiceSeconds"` to its length (`ffprobe -v error -show_entries format=duration -of csv=p=0 <file>`). Keep the `say` text for subtitles.

Same sync, ducking and subtitles then apply. (A single long recording for the whole video also works: `"audio": {"voiceover": "assets/vo.wav"}`, but scenes won't auto-sync to it.)

## Never

- Clone or imitate a real person's voice without their consent.
- Send the script or audio to an online service unless the developer asks for that.
