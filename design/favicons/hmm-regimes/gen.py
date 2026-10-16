import glob,os
from playwright.sync_api import sync_playwright
fs=sorted(glob.glob('/tmp/fav/*.svg'))
cells=''.join(f'<div><img src="file://{f}" width=128><img src="file://{f}" width=32><img src="file://{f}" width=16><p>{os.path.basename(f)[:-4]}</p></div>' for f in fs)
open('/tmp/fav/o.html','w').write(f'<body style="margin:0;background:#050506;color:#a1a1aa;font:13px monospace;display:flex;gap:28px;padding:28px">{cells}<style>div{{display:flex;flex-direction:column;align-items:center;gap:10px}}</style>')
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page(viewport={'width':1180,'height':290});pg.goto('file:///tmp/fav/o.html');pg.screenshot(path='/tmp/fav/options.png')
    for s,n in [(32,'favicon-32.png'),(180,'apple-touch-icon.png')]:
        q=b.new_page(viewport={'width':s,'height':s});q.set_content(open('/tmp/fav/1-barras-regime.svg').read().replace('<svg ',f'<svg width="{s}" height="{s}" ')+'<style>body{margin:0}</style>');q.screenshot(path='/workspace/hmm-regimes/'+n,omit_background=True)
