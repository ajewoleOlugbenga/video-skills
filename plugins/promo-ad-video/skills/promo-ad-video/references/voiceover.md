# Adding a voiceover

The template works without voice (most viewers watch muted). Add a voiceover when the user wants one. Three options, best first:

## 1. The user records it (most authentic, free)

1. Write the voiceover script from the scenes: one short sentence per scene, spoken a little slower than normal. Read it aloud yourself to check the timing: roughly 2.5 words per second.
2. User records on their phone in a quiet room and sends the file.
3. Clean and convert it:
   ```bash
   ffmpeg -i input.m4a -af "highpass=f=80,loudnorm=I=-16:TP=-1.5" -ar 44100 public/assets/vo.mp3
   ```
4. Set `"audio": {"voiceover": "assets/vo.mp3"}`. Music drops to 0.12 volume automatically.
5. Match scene lengths to the voice: measure where each sentence starts (`ffmpeg -i vo.mp3 -af silencedetect=n=-35dB:d=0.3 -f null -`) and set each scene's `seconds` so its text appears as it's spoken.

## 2. Text-to-speech API (if the user has an account and API key)

Services such as ElevenLabs or OpenAI TTS can generate the voice from the script. Only do this with the user's own API key, supplied by them, kept in an environment variable (never written into files). Check the provider's current API docs for the request format, save the result as `public/assets/vo.mp3`, then continue from step 4 above. Pick a voice and accent that fits the audience; several providers offer Nigerian English voices.

## 3. No voiceover

Keep the default music bed and sound effects. Make sure the on-screen text alone tells the whole story.

## Rules

- Never clone or imitate a real person's voice (celebrities, public figures) without their consent.
- The voiceover must match what's on screen; don't add claims in audio that aren't true.
