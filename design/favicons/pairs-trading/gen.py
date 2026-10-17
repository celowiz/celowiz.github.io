"""Opções de favicon do Pairs Trading (mesmo estilo dos outros favicons). Gera option_*.svg e options.png."""
import cairosvg, io
from PIL import Image, ImageDraw, ImageFont
BG = '<rect x="1" y="1" width="62" height="62" rx="14" fill="#0b0d10" stroke="#2a2f36" stroke-width="2"/>'
T = '#2dd4bf'; P = '#f4f1ea'; G = '#71717a'
o = {
 'A': ('Duas linhas entrelaçadas que se cruzam (teal e creme)',
       f'<path d="M9 46 C21 46 21 18 32 18 S43 46 55 46" fill="none" stroke="{P}" stroke-width="6" stroke-linecap="round"/>'
       f'<path d="M9 18 C21 18 21 46 32 46 S43 18 55 18" fill="none" stroke="{T}" stroke-width="6" stroke-linecap="round"/>'),
 'B': ('Spread oscilando entre bandas ±2σ (tracejadas)',
       f'<line x1="10" y1="18" x2="54" y2="18" stroke="{G}" stroke-width="3" stroke-dasharray="5 3"/>'
       f'<line x1="10" y1="46" x2="54" y2="46" stroke="{G}" stroke-width="3" stroke-dasharray="5 3"/>'
       f'<path d="M9 32 C14 32 15 17 21 17 S27 47 33 47 S40 20 45 22 S51 32 55 32" fill="none" stroke="{T}" stroke-width="5.5" stroke-linecap="round"/>'),
 'C': ('Duas setas opostas convergindo para a média',
       f'<line x1="32" y1="12" x2="32" y2="52" stroke="{G}" stroke-width="3" stroke-dasharray="5 3"/>'
       f'<path d="M9 21 H27 M19 12 l9 9 -9 9" fill="none" stroke="{T}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'
       f'<path d="M55 43 H37 M45 34 l-9 9 9 9" fill="none" stroke="{P}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>'),
 'D': ('Dois pontos ligados por um elástico (mola)',
       f'<path d="M21 43 L22 33 L31 42 L33 31 L42 40 L43 21" fill="none" stroke="#a1a1aa" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
       f'<circle cx="17" cy="47" r="9" fill="{T}"/><circle cx="47" cy="17" r="9" fill="{P}"/>'),
 'E': ('Monograma "PT" (P creme, T teal)',
       f'<path d="M14 48 V16 H25 a8 8 0 0 1 0 16 H14" fill="none" stroke="{P}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/>'
       f'<path d="M34 16 H53 M43.5 16 V48" fill="none" stroke="{T}" stroke-width="6.5" stroke-linecap="round"/>'),
 'F': ('Z-score: ponto fora da banda voltando à média',
       f'<line x1="10" y1="32" x2="54" y2="32" stroke="{P}" stroke-width="3" stroke-linecap="round"/>'
       f'<line x1="10" y1="20" x2="54" y2="20" stroke="{G}" stroke-width="3" stroke-dasharray="5 3"/>'
       f'<line x1="10" y1="48" x2="54" y2="48" stroke="{G}" stroke-width="3" stroke-dasharray="5 3"/>'
       f'<path d="M22 12 C34 12 41 19 43 26" fill="none" stroke="{T}" stroke-width="5" stroke-linecap="round"/>'
       f'<path d="M36 23 l7 5 4-7" fill="none" stroke="{T}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>'
       f'<circle cx="18" cy="12" r="7" fill="{T}"/>'),
}
def png(svg, s): return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=s, output_height=s))).convert('RGBA')
W = 1500; rowh = 130; top = 60
im = Image.new('RGB', (W, top + rowh * len(o) + 20), '#050506'); d = ImageDraw.Draw(im)
f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 28)
fs = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
for x, t in [(110, '64px'), (210, '32px'), (275, '16px'), (340, 'aba escura'), (640, 'aba clara'), (940, 'descrição')]:
    d.text((x, 22), t, fill='#a1a1aa', font=fs)
for i, (k, (desc, body)) in enumerate(o.items()):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{BG}{body}</svg>'
    open(f'option_{k}.svg', 'w').write(svg)
    y = top + i * rowh; cy = y + rowh // 2
    d.text((40, cy - 17), k, fill=T, font=f)
    for x, s in [(110, 64), (210, 32), (275, 16)]:
        q = png(svg, s); im.paste(q, (x, cy - s // 2), q)
    for x0, bg, tab, fg in [(340, '#202124', '#35363a', '#e8eaed'), (640, '#dee1e6', '#ffffff', '#202124')]:
        d.rectangle((x0, cy - 30, x0 + 270, cy + 30), fill=bg)
        d.rounded_rectangle((x0 + 12, cy - 18, x0 + 250, cy + 30), 9, fill=tab)
        q = png(svg, 16); im.paste(q, (x0 + 26, cy - 2), q)
        d.text((x0 + 50, cy - 3), 'Pairs Trading — valor…', fill=fg, font=fs)
        d.text((x0 + 232, cy - 3), '×', fill=fg, font=fs)
    d.text((940, cy - 9), desc, fill=P, font=fs)
im.save('options.png')
