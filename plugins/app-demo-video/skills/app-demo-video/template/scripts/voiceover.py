#!/usr/bin/env python3
"""
Free, offline AI voiceover for a demo video brief.

For every scene with a "say" line, generates speech with a Piper voice (run locally by
sherpa-onnx, no account, no API key, nothing sent online), saves it to public/assets/vo/,
measures its length and writes "voice" + "voiceSeconds" back into the brief so each
scene lasts as long as its line.

Setup (once, inside the workspace):
    python3 -m venv .venv
    .venv/bin/pip install sherpa-onnx numpy          (Windows: .venv\\Scripts\\pip ...)

Usage:
    .venv/bin/python scripts/voiceover.py briefs/<app>.json [--voice norman|cori] [--speed 1.05] [--force]
    .venv/bin/python scripts/voiceover.py --samples        # writes a short sample of each voice to out/

Voices offered are ONLY ones cleared for commercial use: trained from scratch on public-domain
LibriVox recordings, MIT licensed. Do not add Lessac-based or NC-licensed voices.
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tarfile, tempfile, urllib.request, wave
from pathlib import Path

VOICES = {
    "norman": {"id": "en_US-norman-medium", "desc": "US English, male"},
    "cori": {"id": "en_GB-cori-medium", "desc": "UK English, female"},
}
MIRROR = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-{id}.tar.bz2"
CACHE = Path(os.environ.get("APP_DEMO_VOICES", Path.home() / ".cache" / "app-demo-video" / "voices"))
OUT_DIR = Path("public/assets/vo")
LEAD = 0.25  # seconds of silence before each line (the engine adds this offset)


def ensure_voice(name: str) -> Path:
    v = VOICES[name]["id"]
    d = CACHE / f"vits-piper-{v}"
    if (d / f"{v}.onnx").exists():
        return d
    CACHE.mkdir(parents=True, exist_ok=True)
    url = MIRROR.format(id=v)
    print(f"Downloading voice '{name}' (~65 MB, once)...", file=sys.stderr)
    with tempfile.TemporaryDirectory() as tmp:
        arc = Path(tmp) / "v.tar.bz2"
        try:
            urllib.request.urlretrieve(url, arc)
        except Exception as e:
            sys.exit(f"Could not download {url}\n{e}\nDownload it manually and extract into {CACHE}")
        with tarfile.open(arc) as t:
            for m in t.getmembers():  # refuse path traversal
                if m.name.startswith("/") or ".." in Path(m.name).parts:
                    sys.exit("Unexpected path in voice archive; aborting.")
            t.extractall(CACHE)
    return d


def load_tts(name: str):
    try:
        import sherpa_onnx  # noqa
    except ImportError:
        sys.exit("sherpa-onnx is not installed. Run:\n  python3 -m venv .venv && .venv/bin/pip install sherpa-onnx numpy")
    d = ensure_voice(name)
    v = VOICES[name]["id"]
    cfg = sherpa_onnx.OfflineTtsConfig(
        model=sherpa_onnx.OfflineTtsModelConfig(
            vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                model=str(d / f"{v}.onnx"), tokens=str(d / "tokens.txt"), data_dir=str(d / "espeak-ng-data")
            ),
            num_threads=max(1, (os.cpu_count() or 2) // 2),
        )
    )
    return sherpa_onnx.OfflineTts(cfg)


# --- text clean-up so the voice reads things the way a person would ---
def speakable(text: str, pronounce: dict) -> str:
    t = re.sub(r"\*", "", text)  # highlight markers
    for word, spoken in sorted(pronounce.items(), key=lambda kv: -len(kv[0])):
        t = re.sub(rf"(?<!\w){re.escape(word)}(?!\w)", spoken, t)
    t = re.sub(r"https?://", "", t)
    t = re.sub(r"\b([\w-]+)\.(com|io|app|dev|ai|co|org|net|so|xyz|ng)\b", lambda m: f"{m.group(1)} dot {m.group(2)}", t)
    t = re.sub(r"(\d)\s?%", r"\1 percent", t)
    t = re.sub(r"₦\s?([\d,]+)", r"\1 naira", t)
    t = re.sub(r"\$\s?([\d,]+)", r"\1 dollars", t)
    t = re.sub(r"£\s?([\d,]+)", r"\1 pounds", t)
    t = re.sub(r"€\s?([\d,]+)", r"\1 euros", t)
    t = t.replace("&", " and ").replace("/", " slash ").replace("→", ",").replace("—", ", ").replace("–", ", ")
    t = re.sub(r"\b(\d+)x\b", r"\1 times", t)
    t = re.sub(r"\s+", " ", t).strip()
    if t and t[-1] not in ".!?":
        t += "."
    return t


def write_wav(path: Path, samples, rate: int):
    import numpy as np
    pcm = (np.clip(np.asarray(samples, dtype="float32"), -1, 1) * 32767).astype("int16")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm.tobytes())


def normalize(path: Path):
    """Even loudness across lines (needs ffmpeg; skipped if missing)."""
    if not shutil.which("ffmpeg"):
        return
    tmp = path.with_suffix(".norm.wav")
    r = subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(path), "-af",
                        "highpass=f=70,loudnorm=I=-16:TP=-1.5:LRA=7", "-ar", "44100", str(tmp)])
    if r.returncode == 0:
        tmp.replace(path)


def duration(path: Path) -> float:
    with wave.open(str(path)) as w:
        return w.getnframes() / w.getframerate()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("brief", nargs="?")
    ap.add_argument("--voice", choices=VOICES.keys())
    ap.add_argument("--speed", type=float)
    ap.add_argument("--force", action="store_true", help="regenerate every line")
    ap.add_argument("--samples", action="store_true", help="write a sample of each voice to out/")
    a = ap.parse_args()

    if a.samples:
        Path("out").mkdir(exist_ok=True)
        line = "Still doing this by hand? Meet your new favourite tool. Set up in two minutes, and free to start."
        for name, info in VOICES.items():
            tts = load_tts(name)
            g = tts.generate(line, sid=0, speed=1.0)
            p = Path("out") / f"voice-sample-{name}.wav"
            write_wav(p, g.samples, g.sample_rate); normalize(p)
            print(f"{name:7} {info['desc']:20} -> {p}")
        return

    if not a.brief:
        ap.error("brief path required (or --samples)")
    bp = Path(a.brief)
    brief = json.loads(bp.read_text(encoding="utf-8"))
    audio = brief.setdefault("audio", {})
    vcfg = audio.setdefault("voice", {})
    name = a.voice or vcfg.get("name") or "norman"
    speed = a.speed or vcfg.get("speed") or 1.0
    vcfg.update(name=name, speed=speed)
    pronounce = audio.get("pronounce", {})

    lines = [(i, s) for i, s in enumerate(brief["scenes"]) if s.get("say")]
    if not lines:
        sys.exit('No scene has a "say" line. Add "say" to the scenes that should be spoken.')

    tts = load_tts(name)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    total = 0.0
    for i, s in lines:
        text = speakable(s["say"], pronounce)
        h = hashlib.sha1(f"{name}|{speed}|{text}".encode()).hexdigest()[:10]
        out = OUT_DIR / f"scene-{i + 1:02d}-{h}.wav"
        if a.force or not out.exists():
            g = tts.generate(text, sid=0, speed=speed)  # sherpa: speed > 1 = faster
            write_wav(out, g.samples, g.sample_rate)
            normalize(out)
        s["voice"] = out.as_posix().replace("public/", "", 1)
        s["voiceSeconds"] = round(duration(out), 2)
        total += s["voiceSeconds"] + LEAD
        words = len(text.split())
        print(f"scene {i + 1:2} {s['type']:9} {s['voiceSeconds']:5.2f}s  {words:2} words  {text[:70]}")
    audio["subtitles"] = audio.get("subtitles", True)

    bp.write_text(json.dumps(brief, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"\nVoice: {name} ({VOICES[name]['desc']}), speed {speed}. Spoken total ~{total:.1f}s across {len(lines)} lines.")
    print(f"Updated {bp}. Scenes now stretch to fit their line. Next: scripts/render.sh {bp} stills")


if __name__ == "__main__":
    main()
