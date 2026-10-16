import cairosvg,io
from PIL import Image,ImageDraw,ImageFont
BG='<rect x="1" y="1" width="62" height="62" rx="14" fill="#0b0d10" stroke="#2a2f36" stroke-width="2"/>'
T='#2dd4bf';P='#f4f1ea';G='#71717a'
o={
'A':('Livro aberto + linha de preço',f'<path d="M32 18c-6-4-13-5-21-4v32c8-1 15 0 21 4c6-4 13-5 21-4V14c-8-1-15 0-21 4z" fill="none" stroke="{P}" stroke-width="3.5" stroke-linejoin="round"/><line x1="32" y1="18" x2="32" y2="50" stroke="{P}" stroke-width="3"/><path d="M15 38l5-6 4 3 4-7" fill="none" stroke="{T}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M36 36l5-4 4 2 4-8" fill="none" stroke="{T}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>'),
'B':('Caderno espiral + gráfico',f'<rect x="18" y="11" width="34" height="42" rx="4" fill="none" stroke="{P}" stroke-width="3.5"/>'+''.join(f'<line x1="12" y1="{y}" x2="22" y2="{y}" stroke="{G}" stroke-width="3.5" stroke-linecap="round"/>' for y in (19,28,37,46))+f'<path d="M26 42l6-8 5 4 9-12" fill="none" stroke="{T}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),
'C':('Livro fechado com candles na capa',f'<path d="M16 14h30a4 4 0 0 1 4 4v32H20a4 4 0 0 1-4-4z" fill="none" stroke="{P}" stroke-width="3.5" stroke-linejoin="round"/><path d="M16 46a4 4 0 0 1 4-4h30" fill="none" stroke="{P}" stroke-width="3"/><line x1="27" y1="24" x2="27" y2="37" stroke="{G}" stroke-width="2.5"/><rect x="24" y="27" width="6" height="7" rx="1" fill="{G}"/><line x1="39" y1="18" x2="39" y2="36" stroke="{T}" stroke-width="2.5"/><rect x="36" y="21" width="6" height="10" rx="1" fill="{T}"/>'),
'D':('Monograma "qn" (estilo mw)',f'<path d="M24 40a8 8 0 1 1 0-16a8 8 0 0 1 0 16zM32 24v26" fill="none" stroke="{P}" stroke-width="4.5" stroke-linecap="round"/><path d="M38 40V30a6 6 0 0 1 12 0v10" fill="none" stroke="{T}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>'),
'E':('Livro aberto teal sólido',f'<path d="M32 20c-6-4-13-5-21-4v30c8-1 15 0 21 4z" fill="{T}"/><path d="M32 20c6-4 13-5 21-4v30c-8-1-15 0-21 4z" fill="{T}" opacity=".55"/><path d="M37 38l4-5 4 2 5-7" fill="none" stroke="#0b0d10" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'),
'F':('Página de notebook (células)',f'<path d="M17 10h22l10 10v34H17z" fill="none" stroke="{P}" stroke-width="3.5" stroke-linejoin="round"/><path d="M39 10v10h10" fill="none" stroke="{P}" stroke-width="3"/><text x="21" y="30" font-family="monospace" font-weight="700" font-size="11" fill="{G}">[ ]</text><path d="M22 46l6-7 5 4 9-10" fill="none" stroke="{T}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'),
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
    d.text((x0+110,y+60),'Quant Notebooks',fill='#e8eaed' if bg[1]=='2' else '#202124',font=fs)
  d.text((1000,y+60),desc,fill=P,font=fs)
im.save('options.png')
