# Video Skills for Claude

Free, open-source Claude skills that make finished videos for you, with no editing software.

| Skill | What it does |
|---|---|
| **App Demo Video** | Point it at a web app's code. Claude scans it, drafts the pitch, asks you a few questions, runs the app, captures screenshots and screen recordings, and renders a polished demo video with zooms, cursor, music and an optional free AI voiceover with subtitles. Landscape or portrait. |
| **Promo Ad Video** | Describe a business or product. Claude writes the ad and renders a 15–30 second animated promo for Reels, TikTok or WhatsApp Status. |

## See it in action

Both videos were made entirely by the skills, with no editing software. Previews are silent; click one to watch the full video with sound.

<table>
  <tr>
    <th>App Demo Video</th>
    <th>Promo Ad Video</th>
  </tr>
  <tr>
    <td valign="top">
      <a href="docs/media/app-demo-example.mp4"><img src="docs/media/app-demo-example.gif" alt="App demo video example: dashboard and task screens in a browser frame with zoom, callouts and subtitles" width="480"></a>
      <br><sub>16:9 demo with AI voiceover and subtitles, made from a small test app. <a href="docs/media/app-demo-example.mp4">Watch with sound (25 s)</a></sub>
    </td>
    <td valign="top">
      <a href="docs/media/promo-ad-example.mp4"><img src="docs/media/promo-ad-example.gif" alt="Promo ad example for a fictional Lagos food business: kinetic text, price burst and call to action" width="240"></a>
      <br><sub>9:16 ad for a fictional food business. <a href="docs/media/promo-ad-example.mp4">Watch with sound (27 s)</a></sub>
    </td>
  </tr>
</table>

## Install

You need [Claude Code](https://code.claude.com/docs/en/quickstart) (a paid Claude plan) and [Node.js 18+](https://nodejs.org). Optional: Python 3 for the AI voiceover, and ffmpeg.

### Option 1: Claude Code (recommended)

Inside a Claude Code session, run:

```
/plugin marketplace add ajewoleOlugbenga/video-skills
/plugin install app-demo-video@video-skills
/plugin install promo-ad-video@video-skills
```

Or from your terminal:

```bash
claude plugin marketplace add ajewoleOlugbenga/video-skills
claude plugin install app-demo-video@video-skills
claude plugin install promo-ad-video@video-skills
```

**Claude desktop app:** in a *local* session in the **Code** tab, click **+** next to the prompt box → **Plugins** → **Add plugin**. (Cloud sessions can't load plugins installed on your machine.)

**Get updates:** `claude plugin marketplace update video-skills`, or turn on auto-update in `/plugin` → **Marketplaces** → `video-skills`.

### Option 2: npx

Works with Claude Code and other agents that support the Agent Skills standard:

```bash
npx skills add ajewoleOlugbenga/video-skills -g -a claude-code
```

### Option 3: Your claude.ai account

Download a skill's zip from the [Releases page](../../releases), then go to **claude.ai → Customize → Skills → + → Create skill → Upload a skill**. Skills you enable there also sync to Claude Code when you're signed in with the same account.

## Use

Open Claude Code in your project folder and ask:

- *"Make a demo video of this app"*, or run `/app-demo-video:app-demo-video`
- *"Make a promo ad for my bakery: sourdough loaves, ₦3,500, WhatsApp 0803…"*, or run `/promo-ad-video:promo-ad-video`

Claude asks its questions in one message, shows you the storyboard, then renders. The first video takes longer because it installs the video engine and a browser once. Videos are saved in a separate workspace folder; your project is never modified.

## Privacy and safety

- Your code stays on your machine. The AI voice is generated offline; nothing is uploaded.
- Secrets in `.env` files are never read. Test accounts and demo data only.

## Contributing

Contributions are welcome: new scene types, new video styles, bug fixes, better docs.

1. Fork the repo and create a branch.
2. Make your change. Test a skill locally with `claude --plugin-dir ./plugins/app-demo-video` and run `claude plugin validate .`
3. Open a pull request describing what changed and, for visual changes, a screenshot or short clip.

Found a bug or have an idea? [Open an issue](../../issues).

## Licences

- This project: [MIT](LICENSE). Use it, change it, share it.
- Video engine: [Remotion](https://www.remotion.dev/license). Free for individuals, companies with up to 3 employees and non-profits; larger companies need a Remotion Company License.
- Fonts: Poppins and Inter, SIL Open Font License.
- Voices: Norman and Cori Piper voices, MIT, trained on public-domain audio. Voice engine: sherpa-onnx, Apache 2.0.
- Sound effects and music bed: generated from scratch, no third-party rights.
