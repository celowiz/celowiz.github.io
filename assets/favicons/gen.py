import cairosvg,io,re,sys
from PIL import Image
def png(svg,s):return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(),output_width=s,output_height=s))).convert("RGBA")
def bleed(svg,scale):  # square full-bleed tile, glyph scaled about center
    inner=re.sub(r'^.*?<rect[^>]*/>','',svg,flags=re.S).replace('</svg>','')
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0b0d10"/><g transform="translate(32 32) scale({scale}) translate(-32 -32)">{inner}</g></svg>'
def export(src,out,pwa):
    svg=open(src).read(); import os; os.makedirs(out,exist_ok=True)
    open(f"{out}/favicon.svg","w").write(svg)
    png(svg,256).save(f"{out}/favicon.ico",sizes=[(16,16),(32,32),(48,48)])
    png(svg,32).save(f"{out}/favicon-32.png")
    png(bleed(svg,0.92),180).convert("RGB").save(f"{out}/apple-touch-icon.png")
    if pwa:
        png(svg,192).save(f"{out}/icon-192.png"); png(svg,512).save(f"{out}/icon-512.png")
        png(bleed(svg,0.75),512).convert("RGB").save(f"{out}/icon-maskable-512.png")
export(sys.argv[1],sys.argv[2],sys.argv[3]=="1")
