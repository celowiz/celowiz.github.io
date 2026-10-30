"""Gera src/resultados/logo-crop.json: para cada logo, a cor de fundo e o
enquadramento (zoom e centro do conteúdo) que faz a marca ocupar o card.
Uso: python3 scripts/resultados-logo-crop.py <pasta com os PNGs>
"""
import glob, json, os, sys
from PIL import Image, ImageChops

FILL = 0.8   # fração do lado que a marca deve ocupar
MAXZ = 1.8   # zoom máximo (evita pixelar demais os PNGs de 56 px)

out = {}
for f in sorted(glob.glob(os.path.join(sys.argv[1], '*.png'))):
    im = Image.open(f).convert('RGBA'); w, h = im.size
    c = im.getpixel((0, 0))
    if c[3] < 20:
        mask = im.getchannel('A').point(lambda v: 255 if v > 20 else 0); bg = '#ffffff'
    else:
        diff = ImageChops.difference(im, Image.new('RGBA', im.size, c)).convert('L')
        mask = diff.point(lambda v: 255 if v > 40 else 0); bg = '#%02x%02x%02x' % c[:3]
    bb = mask.getbbox() or (0, 0, w, h)
    bw, bh = (bb[2] - bb[0]) / w, (bb[3] - bb[1]) / h
    z = max(1.0, min(MAXZ, FILL / max(bw, bh)))
    out[os.path.basename(f)[:-4]] = {
        'bg': bg, 'z': round(z, 3),
        'cx': round((bb[0] + bb[2]) / 2 / w, 3), 'cy': round((bb[1] + bb[3]) / 2 / h, 3),
    }
json.dump(out, open('src/resultados/logo-crop.json', 'w'), indent=1); open('src/resultados/logo-crop.json', 'a').write('\n')
print(len(out), 'logos')
