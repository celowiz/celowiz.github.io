import cairosvg,io
from PIL import Image,ImageDraw,ImageFont
BG='<rect x="1" y="1" width="62" height="62" rx="14" fill="#0b0d10" stroke="#2a2f36" stroke-width="2"/>'
T='#2dd4bf';P='#f4f1ea';G='#71717a'
o={
'A':('Quadrantes + rastro curvo com seta',f'<line x1="32" y1="12" x2="32" y2="52" stroke="{G}" stroke-width="2"/><line x1="12" y1="32" x2="52" y2="32" stroke="{G}" stroke-width="2"/><path d="M20 42C18 28 30 18 42 22" fill="none" stroke="{T}" stroke-width="4" stroke-linecap="round"/><path d="M36 16l7 6-8 4" fill="none" stroke="{T}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),
'B':('Quadrantes coloridos (4 tons)',f'<rect x="12" y="12" width="19" height="19" rx="3" fill="#60a5fa" opacity=".8"/><rect x="33" y="12" width="19" height="19" rx="3" fill="{T}"/><rect x="12" y="33" width="19" height="19" rx="3" fill="#f87171" opacity=".8"/><rect x="33" y="33" width="19" height="19" rx="3" fill="#facc15" opacity=".8"/><circle cx="42" cy="22" r="4" fill="#0b0d10"/>'),
'C':('Setas circulares de rotação',f'<path d="M46 26a15 15 0 0 0-26-6" fill="none" stroke="{T}" stroke-width="4.5" stroke-linecap="round"/><path d="M18 13v8h8" fill="none" stroke="{T}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 38a15 15 0 0 0 26 6" fill="none" stroke="{P}" stroke-width="4.5" stroke-linecap="round"/><path d="M46 51v-8h-8" fill="none" stroke="{P}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'),
'D':('Ponto com rastro esmaecendo',f'<line x1="32" y1="12" x2="32" y2="52" stroke="#2a2f36" stroke-width="2"/><line x1="12" y1="32" x2="52" y2="32" stroke="#2a2f36" stroke-width="2"/><circle cx="18" cy="40" r="3" fill="{T}" opacity=".2"/><circle cx="20" cy="29" r="3.5" fill="{T}" opacity=".4"/><circle cx="28" cy="21" r="4" fill="{T}" opacity=".65"/><circle cx="42" cy="21" r="7" fill="{T}"/>'),
'E':('Órbita em espiral',f'<path d="M32 32m-4 0a4 4 0 1 1 8 0a9 9 0 0 1-18 0a14 14 0 0 1 28 0" fill="none" stroke="{P}" stroke-width="3.5" stroke-linecap="round"/><circle cx="46" cy="32" r="5" fill="{T}"/>'),
'F':('Monograma "rrg"',f'<text x="13" y="41" font-family="DejaVu Sans" font-weight="700" font-size="22" fill="{P}">r<tspan fill="{T}">r</tspan>g</text>'),
}
def png(svg,s): return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(),output_width=s,output_height=s))).convert('RGBA')
W=1500;rowh=170;im=Image.new('RGB',(W,60+rowh*len(o)),'#050506');d=ImageDraw.Draw(im)
f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',26);fs=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',16)
for x,t in [(200,'128px'),(400,'32 / 16 em aba escura'),(700,'32 / 16 em aba clara'),(1000,'descrição')]:d.text((x,20),t,fill='#a1a1aa',font=fs)
for i,(k,(desc,body)) in enumerate(o.items()):
  svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">{BG}{body}</svg>';open(f'option_{k}.svg','w').write(svg)
  y=60+i*rowh;d.text((40,y+50),k,fill=T,font=f)
  im.paste(p:=png(svg,128),(200,y+10),p)
  for x0,bg in [(400,'#202124'),(700,'#dee1e6')]:
    d.rounded_rectangle((x0,y+40,x0+240,y+100),10,fill=bg)
    for xx,s in [(x0+20,32),(x0+80,16)]:
      q=png(svg,s);im.paste(q,(xx,y+70-s//2),q)
    d.text((x0+110,y+60),'RRG',fill='#e8eaed' if bg[1]=='2' else '#202124',font=fs)
  d.text((1000,y+60),desc,fill=P,font=fs)
im.save('options.png')
