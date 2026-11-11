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
Two versions come out of every clip:
  ein-yaakov-<slug>-clip<N>.mp4   WhatsApp Status and Reels: full layout, CTA and progress bar at the bottom.
  ein-yaakov-<slug>-short<N>.mp4  YouTube Shorts: everything clear of the Shorts title, channel row and right-hand
                                  buttons; no progress bar (Shorts draws its own); a "Subscribe" end card.
plus a still card per version and ein-yaakov-<slug>-clip<N>.txt with the WhatsApp caption and the Shorts title
and description. Pass --only whatsapp or --only shorts to build one version. PREVIEW=1 prints the finished
caption text and length without rendering, for checking `fixes`.
Optional per clip: `skip` ([[from, to], ...] in shiur seconds) drops side comments from inside the clip;
`cover_title` (+ `kicker`, `cover_size`) adds a thumbnail frame for the first 1.2 s and saves it as a JPG.
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
    """fixes: [[["heard", "words"], ["right", "words"]], ...]; timing is spread across the replacement.
    An empty replacement deletes the words from the captions (the audio is untouched)."""
    out = []; i = 0
    while i < len(ws):
        for src, dst in fixes:
            if [w['w'].strip() for w in ws[i:i + len(src)]] == src:
                s, e = ws[i]['s'], ws[i + len(src) - 1]['e']; step = (e - s) / max(1, len(dst))  # dst [] deletes
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
 .p{position:absolute;left:50%;transform:translateX(-43.5%);top:330px;height:620px;
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

def cta_text(cfg, c):
    """Ready-to-paste post copy: the WhatsApp caption and the YouTube Shorts title and description."""
    hook = c['hook'].replace('<br>', ' ').replace('“', '"').replace('”', '"')
    title = c.get('shorts_title') or f"{hook} | Ein Yaakov {cfg['masechta']} | Rabbi Chaim Fogelman"
    tags = ' '.join(['#EinYaakov', *c.get('tags', ['#Torah', '#Gemara']), '#Shorts'])
    url = 'https://www.' + cfg['link']
    question = c.get('cta') or hook
    return (f"WHATSAPP STATUS (caption on the clip, or a text status with the link)\n{question} Listen to the whole shiur 👇\n{url}\n\n"
            f"YOUTUBE SHORTS TITLE ({len(title)} of 100 characters)\n{title}\n\n"
            f"YOUTUBE SHORTS DESCRIPTION\n{c.get('blurb', '')}\n\n"
            f"From the Ein Yaakov shiur on {c.get('from', cfg['masechta'])}. Listen to the whole shiur: {cfg['link']}\n\n"
            "New shiur every week, Tuesday nights at 8pm at the Itchkes Shtiebel. Also on Spotify and Apple Podcasts.\n\n"
            f"{tags}\n")

# Layouts. Shorts covers roughly the bottom 22% of the frame (title, channel, subscribe) and a ~170 px column
# on the right from about y=1000 (like, comment, share), so the Shorts layout keeps everything inside
# x 80..900 below y=1000 and above y=1480, and drops the progress bar YouTube already shows.
LAYOUTS = {
    'whatsapp': dict(
        suffix='clip',
        css=' .brand{top:280px} .p{top:390px;height:600px} .hook{top:985px;font-size:66px} .sub{top:1160px} .rule{top:1214px}',
        extra='<div class="cta" style="top:1600px"><div class="l1">Listen to the whole shiur</div><div class="l2">einyaakovshiur.com</div><div class="l3">Spotify · Apple Podcasts</div></div>',
        cap_margins=(110, 110, 1268), wave=(90, 1470, 900, 100), bar=1772,
        end_css='top:990px;left:60px;right:60px', end_title=84, end_link=50,
        end_extra=('<div style="margin-top:22px;font-weight:600;font-size:26px;letter-spacing:.12em;opacity:.8;text-transform:uppercase">Also on Spotify · Apple Podcasts · Amazon Music</div>'
                   '<div style="margin-top:40px;font-weight:600;font-size:30px;opacity:.85">New shiur every week</div>')),
    'shorts': dict(
        suffix='short',
        css=' .brand{top:150px} .p{top:250px;height:520px} .hook{top:770px;font-size:62px} .sub{top:935px} .rule{display:none}',
        extra='<div class="cta" style="top:1372px;left:80px;right:180px"><div class="l1" style="font-size:28px">Full shiur · <b style="font-weight:800">einyaakovshiur.com</b></div></div>',
        cap_margins=(80, 190, 1030), wave=(80, 1240, 740, 90), bar=None,
        end_css='top:780px;left:80px;right:180px', end_title=74, end_link=40,
        end_extra='<div style="margin-top:34px;font-weight:700;font-size:32px;opacity:.9">Subscribe for a new shiur every week</div>'),
}

def cover_markup(cfg, c, L, duo):
    """The thumbnail: a story title big enough to read in the Shorts grid, the Rav, and the brand.
    In the Shorts version the title stays left of the button column and nothing sits below y=1480."""
    short = L['suffix'] == 'short'
    right = 180 if short else 70
    kicker = c.get('kicker', 'A story from the Gemara')
    title = c['cover_title'].replace("'", "’")
    foot = '' if short else (
        '<div style="position:absolute;top:1690px;left:0;right:0;text-align:center;font-weight:700;font-size:34px;color:#c9d5ff">'
        f'Listen to the whole shiur · <span style="color:#ffd76a">{cfg["link"]}</span></div>')
    top = 0 if short else 70
    return f'''<style>.brand{{top:{150 + top}px!important}}</style><div class="c" style="background:radial-gradient(120% 70% at 50% 28%,#2d55ef 0%,#0f2680 55%,#081a63 100%)">
 {BRAND}
 <img class="p" src="data:image/png;base64,{duo}" style="top:{250 + top}px;height:690px">
 <div style="position:absolute;top:{1010 + top}px;left:70px;right:{right}px;text-align:left">
  <div style="display:inline-block;background:#ffd76a;color:#081a63;font-weight:800;font-size:32px;letter-spacing:.12em;text-transform:uppercase;padding:10px 22px;border-radius:8px">{kicker}</div>
  <div style="margin-top:26px;font-weight:800;font-size:{c.get('cover_size', 112)}px;line-height:1.0;letter-spacing:-.02em;text-wrap:balance">{title}</div>
  <div style="margin-top:28px;font-weight:700;font-size:34px;color:#c9d5ff;letter-spacing:.03em">Ein Yaakov {c.get('from', cfg['masechta'])} · Rabbi Chaim Fogelman</div>
 </div>{foot}</div></body></html>'''

def build(cfg, c, W, only=None):
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
    start = max(0, ws[i0]['s'] - 0.3); end = ws[i1]['e'] + 0.7
    # keep [start, end] minus any `skip` spans (shiur seconds), so a story can drop a side comment
    keep, t = [], start
    for a, b in sorted(c.get('skip', [])):
        a, b = a - c['at'], b - c['at']
        if a > t: keep.append((t, a))
        t = max(t, b)
    keep.append((t, end))
    def remap(x):
        off = 0
        for a, b in keep:
            if a <= x <= b: return off + x - a
            off += b - a
        return None
    kept = [{'w': w['w'], 's': remap(w['s']), 'e': remap(w['e'])} for w in ws[i0:i1 + 1]]
    kept = [w for w in kept if w['s'] is not None and w['e'] is not None]
    dur = sum(b - a for a, b in keep)
    ws = apply_fixes(kept, c.get('fixes', []))
    if ws: ws[0]['w'] = ws[0]['w'][0].upper() + ws[0]['w'][1:]
    if os.environ.get('PREVIEW'):
        # PREVIEW=1: print the final caption text and length, render nothing
        print(f'--- {slug} clip {n}: {dur:.1f}s\n' + ' '.join(w['w'] for w in ws)); return

    wav = os.path.join(W, f'{slug}-clip{n}.wav')
    parts = ''.join(f'[0:a]atrim={a:.2f}:{b:.2f},asetpts=PTS-STARTPTS,afade=t=in:d=0.04,afade=t=out:st={b - a - 0.04:.2f}:d=0.04[p{k}];'
                    for k, (a, b) in enumerate(keep))
    chain = ('highpass=f=100,afftdn=nr=30:nf=-40:tn=1,agate=threshold=0.02:range=0.25:attack=5:release=250:ratio=3,'
             f'loudnorm=I=-15:TP=-1.5:LRA=9,afade=t=in:d=0.15,afade=t=out:st={dur - 0.6:.2f}:d=0.6')
    ff('-i', win, '-filter_complex', parts + ''.join(f'[p{k}]' for k in range(len(keep))) + f'concat=n={len(keep)}:v=0:a=1,{chain}[a]',
       '-map', '[a]', '-ar', '44100', '-ac', '1', '-c:a', 'pcm_s16le', wav)

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
    open(os.path.join(W, f'ein-yaakov-{slug}-clip{n}.txt'), 'w').write(cta_text(cfg, c))
    for fmt, L in LAYOUTS.items():
        if not only or fmt == only: render(cfg, c, W, L, ev, wav, dur, duo)

def render(cfg, c, W, L, ev, wav, dur, duo):
    n, slug, sx = c['id'], cfg['slug'], L['suffix']
    ml, mr, mv = L['cap_margins']
    ass = os.path.join(W, f'{slug}-{sx}{n}.ass')
    open(ass, 'w').write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Cap,Figtree ExtraBold,68,&H00FFFFFF,&H00FFFFFF,&H80631A08,&H00000000,0,0,0,0,100,100,0,0,1,3,0,8,{ml},{mr},{mv},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + '\n'.join(ev) + '\n')

    head = HEAD.replace('</style>', L['css'] + '\n</style>')
    bg_html, bg = os.path.join(W, f'bg-{sx}{n}.html'), os.path.join(W, f'bg-{sx}{n}.png')
    open(bg_html, 'w').write(head + f'''<div class="c">{BRAND}<img class="p" src="data:image/png;base64,{duo}">
 <div class="hook">{c['hook']}</div><div class="sub">{c['sub']}</div><div class="rule"></div>
 {L['extra']}
</div></body></html>''')
    shoot(bg_html, bg)
    end_html, endp = os.path.join(W, f'end-{sx}{n}.html'), os.path.join(W, f'end-{sx}{n}.png')
    open(end_html, 'w').write(head + f'''<div class="c">{BRAND}<img class="p" src="data:image/png;base64,{duo}" style="opacity:.55">
 <div style="position:absolute;{L['end_css']};text-align:center">
  <div style="font-weight:800;font-size:{L['end_title']}px;line-height:1.08">Listen to the<br>whole shiur</div>
  <div style="margin:40px auto 0;width:90px;height:3px;background:rgba(255,255,255,.35);border-radius:2px"></div>
  <div style="margin-top:40px;font-weight:800;font-size:{L['end_link']}px;color:#ffd76a">{cfg['link']}</div>
  {L['end_extra']}
 </div></div></body></html>''')
    shoot(end_html, endp)
    ff('-i', bg, '-q:v', '3', os.path.join(W, f'ein-yaakov-{slug}-{sx}{n}-card.jpg'))
    cover = None
    if c.get('cover_title'):
        cover_html, cover = os.path.join(W, f'cover-{sx}{n}.html'), os.path.join(W, f'cover-{sx}{n}.png')
        open(cover_html, 'w').write(head + cover_markup(cfg, c, L, duo))
        shoot(cover_html, cover)
        ff('-i', cover, '-q:v', '2', os.path.join(W, f'ein-yaakov-{slug}-{sx}{n}-thumbnail.jpg'))

    wx, wy, ww, wh = L['wave']
    fc = (f"[1:a]asplit=2[aout][aw];[aw]showwaves=s={ww}x{wh}:mode=cline:colors=white@0.85:rate=30:scale=sqrt:draw=full[wv];"
          f"[0:v][wv]overlay={wx}:{wy}:format=auto[v1];")
    if L['bar'] is not None:
        # progress bar: a gold bar slides in from the left; the left margin is repainted in the background color
        y = L['bar']
        fc += (f"color=c=0xFFD76A:s=900x6:r=30[bar];[v1]drawbox=x=90:y={y}:w=900:h=6:color=white@0.22:t=fill[v1b];"
               f"[v1b][bar]overlay=x='90-900+900*t/{dur:.2f}':y={y}:eval=frame[v2];[v2]drawbox=x=0:y={y}:w=90:h=6:color=0x091C66:t=fill,")
    else:
        fc += "[v1]"
    fc += f"ass={ass}:fontsdir={FONTS},format=yuv420p"
    extra_in = []
    if cover:
        fc += "[vm];[2:v]format=yuva420p,fade=t=out:st=1.2:d=0.35:alpha=1[cv];[vm][cv]overlay=0:0:eof_action=pass,format=yuv420p[vout]"
        extra_in = ['-loop', '1', '-framerate', '30', '-t', '1.6', '-i', cover]
    else:
        fc += "[vout]"
    main = os.path.join(W, f'main-{sx}{n}.mp4')
    ff('-loop', '1', '-framerate', '30', '-i', bg, '-i', wav, *extra_in, '-filter_complex', fc, '-map', '[vout]', '-map', '[aout]',
       '-t', f'{dur:.2f}', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '128k', main)
    out = os.path.join(W, f'ein-yaakov-{slug}-{sx}{n}.mp4')
    ff('-i', main, '-loop', '1', '-framerate', '30', '-t', '2.5', '-i', endp, '-f', 'lavfi', '-t', '2.5', '-i', 'anullsrc=r=44100:cl=mono',
       '-filter_complex', '[1:v]format=yuv420p,fade=t=in:d=0.3[e];[2:a]aformat=sample_rates=44100:channel_layouts=mono[ea];'
                          '[0:a]aformat=sample_rates=44100:channel_layouts=mono[ma];[0:v][ma][e][ea]concat=n=2:v=1:a=1[v][a]',
       '-map', '[v]', '-map', '[a]', '-r', '30', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out)
    os.remove(main)
    print(f'{out}: {dur + 2.5:.1f}s, {len(ev)} caption events, {os.path.getsize(out)} bytes')

if __name__ == '__main__':
    args = sys.argv[1:]
    only = None
    if '--only' in args:
        k = args.index('--only'); only = args[k + 1]; del args[k:k + 2]
    cfg_path, W, *ids = args
    cfg = json.load(open(cfg_path)); os.makedirs(W, exist_ok=True)
    cfg['source'] = os.path.expandvars(cfg['source'])
    for c in cfg['clips']:
        if not ids or str(c['id']) in ids: build(cfg, c, os.path.abspath(W), only)
