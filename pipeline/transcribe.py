"""Usage: MASECHTA=Kesuvos python transcribe.py MODEL OUT_DIR audio1.mp3 [audio2.mp3 ...]

Writes OUT_DIR/<name>.json with timestamped segments, using faster-whisper on CPU.
The initial prompt primes the vocabulary the shiur uses so names and terms come out right.
"""
import json, os, subprocess, sys, time
import numpy as np
from faster_whisper import WhisperModel

# Set MASECHTA to the masechta being transcribed, e.g. MASECHTA="Kesuvos (Kesubos, Ketubot)".
PROMPT = (f"A shiur on Ein Yaakov, Masechta {os.environ.get('MASECHTA', '')}, by Rabbi Fogelman. "
          "Gemara, Rashi, Maharsha, Tosafos, Chazal, Hashem, Torah, Yom Tov, Shabbos, "
          "Hakadosh Baruch Hu, Klal Yisrael, Rebbi, Rabbi Yehoshua, siyum, hadran, daf, amud.")

def load_audio(path):
    """Decode to 16 kHz mono float32 with ffmpeg (avoids PyAV version mismatches)."""
    raw = subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0

model_name, out_dir, *files = sys.argv[1:]
os.makedirs(out_dir, exist_ok=True)
model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=int(os.environ.get("THREADS", "2")))
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    t0 = time.time()
    segs, info = model.transcribe(load_audio(f), language="en", initial_prompt=PROMPT, beam_size=1, vad_filter=True)
    out = [{"start": round(s.start, 1), "end": round(s.end, 1), "text": s.text.strip()} for s in segs]
    json.dump({"file": os.path.basename(f), "model": model_name, "duration": info.duration, "segments": out},
              open(os.path.join(out_dir, name + ".json"), "w"), ensure_ascii=False, indent=1)
    print(f"{name}: {len(out)} segments in {time.time() - t0:.0f}s", flush=True)
