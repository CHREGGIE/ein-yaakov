"""Build vertical (1080x1920) share clips for WhatsApp Status, YouTube Shorts, Reels and TikTok.

Usage:
  python3 pipeline/clips/makeclip.py pipeline/clips/kesuvos-06.json WORKDIR [clip ids...]

The config names the cleaned shiur MP3 and, for each clip, where its window starts (`at`, seconds),
how long a window to pull (`window`), the hook text, and the first and last words to keep.
For each clip it:
  1. cuts the window from the MP3 and word-transcribes it (faster-whisper, cached in WORKDIR),
  2. trims to the chosen first/last words and applies the spelling fixes,
  3. cleans the voice (highpass, denoise, gentle gate, -15 LUFS); no music,
  4. renders the branded background and the "Listen to the whole shiur" end card with Playwright,
  5. burns in word-by-word captions, a waveform and a progress bar, and appends the 2.5 s end card.
Output: WORKDIR/ein-yaakov-<slug>-clip<N>.mp4 and a still card WORKDIR/ein-yaakov-<slug>-card<N>.jpg.
Needs ffmpeg with libass, node with playwright, and the venv with faster-whisper.
"""
import base64, json, os, subprocess, sys

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FONTS = os.path.join(REPO, 'assets/fonts')
DUO = os.path.join(REPO, 'assets/clips/rabbi-duo.png')
WHISPER_MODEL = os.environ.get('CLIP_MODEL', 'small.en')

def run(*a): subprocess.run(list(a), check=True)

def ff(*a): run('ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *a)

def words(mp3, out, vocab):
    """Word-level timestamps for one clip window (cached)."""
    if os.path.exists(out): return json.load(open(out))
    import numpy as np
    from faster_whisper import WhisperModel
    raw = subprocess.run(['ffmpeg', '-nostdin', '-loglevel', 'error', '-i', mp3, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'],
                         check=True, capture_output=True).stdout
    audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
    m = WhisperModel(WHISPER_MODEL, device='cpu', compute_type='int8', cpu_threads=4)
    prompt = 'A shiur on Ein Yaakov by Rabbi Chaim Fogelman. Torah, Hashem, the Rebbe, Chazal, tzedakah, ' + vocab
    segs, _ = m.transcribe(audio, language='en', initial_prompt=prompt, beam_size=5, word_timestamps=True)
    ws = [{'w': w.word, 's': round(w.start, 2), 'e': round(w.end, 2)} for s in segs for w in s.words]
    json.dump(ws, open(out, 'w'), ensure_ascii=False)
    return ws

def apply_fixes(ws, fixes):
    """fixes: [[["heard", "words"], ["right", "words"]], ...]; timing is spread across the replacement."""
    out = []; i = 0
    while i < len(ws):
        for src, dst in fixes:
            if [w['w'].strip() for w in ws[i:i + len(src)]] == src:
                s, e = ws[i]['s'], ws[i + len(src) - 1]['e']; step = (e - s) / len(dst)
                out += [{'w': d, 's': round(s + k * step, 2), 'e': round(s + (k + 1) * step, 2)} for k, d in enumerate(dst)]
                i += len(src); break
        else:
            out.append({'w': ws[i]['w'].strip(), 's': ws[i]['s'], 'e': ws[i]['e']}); i += 1
    return out

def ass_time(t):
    t = max(0, t); return f'{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}'

FACES = ''.join(f"@font-face{{font-family:Figtree;src:url(file://{FONTS}/figtree-{w}.ttf);font-weight:{w}}}" for w in (500, 600, 700, 800)) + \
        f"@font-face{{font-family:'Frank Ruhl Libre';src:url(file://{FONTS}/frank-700.ttf);font-weight:700}}"
HEAD = '''<html><head><style>''' + FACES + '''
html,body{margin:0} .c{width:1080px;height:1920px;position:relative;overflow:hidden;color:#fff;font-family:Figtree,sans-serif;
 background:linear-gradient(180deg,#0f2680 0%,#0e2479 45%,#081a63 100%)}
 .brand{position:absolute;top:214px;left:0;right:0;text-align:center}
 .brand .he{font:700 64px/1 'Frank Ruhl Libre',serif;direction:rtl}
 .brand .en{margin-top:14px;font-weight:700;letter-spacing:.22em;font-size:22px;opacity:.85}
 .p{position:absolute;left:50%;transform:translateX(-50%);top:330px;height:620px;
   -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 16%,#000 84%,transparent 100%),linear-gradient(180deg,#000 60%,transparent 97%);
   -webkit-mask-composite:source-in}
 .hook{position:absolute;top:930px;left:70px;right:70px;text-align:center;font-weight:800;font-size:66px;line-height:1.12;letter-spacing:-.01em}
 .sub{position:absolute;top:1112px;left:70px;right:70px;text-align:center;font-weight:600;font-size:26px;letter-spacing:.06em;color:#bcd0ff;text-transform:uppercase}
 .cta{position:absolute;top:1590px;left:0;right:0;text-align:center}
 .cta .l1{font-weight:600;font-size:28px;opacity:.85}
 .cta .l2{margin-top:10px;font-weight:800;font-size:46px;letter-spacing:.01em}
 .cta .l3{margin-top:12px;font-weight:600;font-size:24px;letter-spacing:.12em;opacity:.75;text-transform:uppercase}
 .rule{position:absolute;top:1170px;left:50%;width:90px;margin-left:-45px;height:3px;background:rgba(255,255,255,.35);border-radius:2px}
</style></head><body>'''
BRAND = '<div class="brand"><div class="he">עין יעקב</div><div class="en">EIN YAAKOV · RABBI CHAIM FOGELMAN</div></div>'

def shoot(html_path, png_path):
    js = f'''const {{ chromium }} = require('playwright');
(async () => {{ const b = await chromium.launch(); const p = await b.newPage({{ viewport: {{ width: 1080, height: 1920 }} }});
 await p.goto('file://{html_path}'); await p.evaluate(() => document.fonts.ready);
 await p.screenshot({{ path: '{png_path}' }}); await b.close(); }})();'''
    run('node', '-e', js)

def build(cfg, c, W):
    n, slug = c['id'], cfg['slug']
    duo = base64.b64encode(open(DUO, 'rb').read()).decode()
    win = os.path.join(W, f'{slug}-clip{n}.mp3')
    if not os.path.exists(win):
        ff('-ss', str(c['at']), '-t', str(c.get('window', 75)), '-i', cfg['source'], '-c', 'copy', win)
    ws = words(win, win.replace('.mp3', '.words.json'), cfg.get('vocab', ''))
    low = lambda i: ws[i]['w'].strip().lower()
    i0 = next(i for i in range(len(ws)) if low(i) == c['start_word'].lower()) if c.get('start_word') else 0
    if c.get('end_after'):
        il = next(i for i in range(len(ws)) if low(i).startswith(c['end_after'].lower()) and i > len(ws) // 2)
        i1 = next(i for i in range(il, len(ws)) if low(i).startswith(c['end_word'].lower()))
    else:
        i1 = max(i for i in range(len(ws)) if low(i).startswith(c['end_word'].lower()))
    start = max(0, ws[i0]['s'] - 0.3); end = ws[i1]['e'] + 0.7; dur = end - start
    ws = apply_fixes([{'w': w['w'], 's': w['s'] - start, 'e': w['e'] - start} for w in ws[i0:i1 + 1]], c.get('fixes', []))
    if ws: ws[0]['w'] = ws[0]['w'][0].upper() + ws[0]['w'][1:]

    wav = os.path.join(W, f'{slug}-clip{n}.wav')
    ff('-ss', f'{c["at"] + start:.2f}', '-t', f'{dur:.2f}', '-i', cfg['source'],
       '-af', ('highpass=f=100,afftdn=nr=30:nf=-40:tn=1,agate=threshold=0.02:range=0.25:attack=5:release=250:ratio=3,'
               f'loudnorm=I=-15:TP=-1.5:LRA=9,afade=t=in:d=0.15,afade=t=out:st={dur - 0.6:.2f}:d=0.6'),
       '-ar', '44100', '-c:a', 'pcm_s16le', wav)

    # captions: ~30-character chunks; the spoken word is gold, said words white, upcoming words dim
    chunks, cur = [], []
    for w in ws:
        cur.append(w)
        if len(' '.join(x['w'] for x in cur)) >= 30 or (w['w'][-1] in '.?!' and len(cur) >= 3): chunks.append(cur); cur = []
    if cur: chunks.append(cur)
    ev = []
    for ci, ch in enumerate(chunks):
        nxt = chunks[ci + 1][0]['s'] if ci + 1 < len(chunks) else dur
        for wi, w in enumerate(ch):
            t0 = w['s'] if wi else (ch[0]['s'] if ci == 0 else chunks[ci - 1][-1]['e'])
            t1 = ch[wi + 1]['s'] if wi + 1 < len(ch) else nxt
            parts = [(r'{\c&H6AD7FF&}' if k == wi else (r'{\c&HFFFFFF&\alpha&H00&}' if k < wi else r'{\c&HFFFFFF&\alpha&H70&}')) + x['w']
                     for k, x in enumerate(ch)]
            ev.append(f'Dialogue: 0,{ass_time(t0)},{ass_time(t1)},Cap,,0,0,0,,' + ' '.join(parts))
    ass = os.path.join(W, f'{slug}-clip{n}.ass')
    open(ass, 'w').write('''[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Figtree ExtraBold,68,&H00FFFFFF,&H00FFFFFF,&H80631A08,&H00000000,0,0,0,0,100,100,0,0,1,3,0,8,110,110,1232,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
''' + '\n'.join(ev) + '\n')

    link = cfg['link']
    bg_html, bg = os.path.join(W, f'bg{n}.html'), os.path.join(W, f'bg{n}.png')
    open(bg_html, 'w').write(HEAD + f'''<div class="c">{BRAND}<img class="p" src="data:image/png;base64,{duo}">
 <div class="hook">{c['hook']}</div><div class="sub">{c['sub']}</div><div class="rule"></div>
 <div class="cta"><div class="l1">Listen to the whole shiur</div><div class="l2">einyaakovshiur.com</div><div class="l3">Spotify · Apple Podcasts</div></div>
</div></body></html>''')
    shoot(bg_html, bg)
    end_html, endp = os.path.join(W, f'end{n}.html'), os.path.join(W, f'end{n}.png')
    open(end_html, 'w').write(HEAD + f'''<div class="c">{BRAND}<img class="p" src="data:image/png;base64,{duo}" style="opacity:.55">
 <div style="position:absolute;top:930px;left:60px;right:60px;text-align:center">
  <div style="font-weight:800;font-size:84px;line-height:1.08">Listen to the<br>whole shiur</div>
  <div style="margin:44px auto 0;width:90px;height:3px;background:rgba(255,255,255,.35);border-radius:2px"></div>
  <div style="margin-top:44px;font-weight:800;font-size:50px;color:#ffd76a">{link}</div>
  <div style="margin-top:22px;font-weight:600;font-size:26px;letter-spacing:.12em;opacity:.8;text-transform:uppercase">Also on Spotify · Apple Podcasts · Amazon Music</div>
  <div style="margin-top:40px;font-weight:600;font-size:30px;opacity:.85">New shiur every week</div>
 </div></div></body></html>''')
    shoot(end_html, endp)
    card = os.path.join(W, f'ein-yaakov-{slug}-card{n}.jpg')
    ff('-i', bg, '-q:v', '3', card)

    main = os.path.join(W, f'main{n}.mp4')
    fc = (f"[1:a]asplit=2[aout][aw];[aw]showwaves=s=900x110:mode=cline:colors=white@0.85:rate=30:scale=sqrt:draw=full[wv];"
          f"color=c=0xFFD76A:s=900x6:r=30[bar];[0:v]drawbox=x=90:y=1772:w=900:h=6:color=white@0.22:t=fill[v0];"
          f"[v0][wv]overlay=90:1458:format=auto[v1];[v1][bar]overlay=x='90-900+900*t/{dur:.2f}':y=1772:eval=frame[v2];"
          f"[v2]drawbox=x=0:y=1772:w=90:h=6:color=0x091C66:t=fill,ass={ass}:fontsdir={FONTS},format=yuv420p[vout]")
    ff('-loop', '1', '-framerate', '30', '-i', bg, '-i', wav, '-filter_complex', fc, '-map', '[vout]', '-map', '[aout]',
       '-t', f'{dur:.2f}', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '128k', main)
    out = os.path.join(W, f'ein-yaakov-{slug}-clip{n}.mp4')
    ff('-i', main, '-loop', '1', '-framerate', '30', '-t', '2.5', '-i', endp, '-f', 'lavfi', '-t', '2.5', '-i', 'anullsrc=r=44100:cl=mono',
       '-filter_complex', '[1:v]format=yuv420p,fade=t=in:d=0.3[e];[2:a]aformat=sample_rates=44100:channel_layouts=mono[ea];'
                          '[0:a]aformat=sample_rates=44100:channel_layouts=mono[ma];[0:v][ma][e][ea]concat=n=2:v=1:a=1[v][a]',
       '-map', '[v]', '-map', '[a]', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out)
    print(f'{out}: {dur + 2.5:.1f}s, {len(ev)} caption events, {os.path.getsize(out)} bytes')

if __name__ == '__main__':
    cfg_path, W, *ids = sys.argv[1:]
    cfg = json.load(open(cfg_path)); os.makedirs(W, exist_ok=True)
    cfg['source'] = os.path.expandvars(cfg['source'])
    for c in cfg['clips']:
        if not ids or str(c['id']) in ids: build(cfg, c, os.path.abspath(W))
