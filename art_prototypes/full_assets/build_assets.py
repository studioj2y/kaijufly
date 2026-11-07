"""Extract magenta-backed sprite atlases and encode compact runtime WebP art."""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

ROOT = Path(__file__).resolve().parent

def chroma_cut(image):
    rgb = np.asarray(image.convert('RGB')).astype(np.int16)
    red, green, blue = rgb[:,:,0], rgb[:,:,1], rgb[:,:,2]
    magenta = (red > 125) & (blue > 125) & (np.minimum(red, blue) - green > 68)
    alpha = Image.fromarray(np.where(magenta, 0, 255).astype('uint8'), 'L')
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.45))
    out = image.convert('RGBA')
    out.putalpha(alpha)
    box = alpha.getbbox()
    if not box:
        raise RuntimeError('Empty extracted sprite')
    x0,y0,x1,y1=box
    pad=14
    return out.crop((max(0,x0-pad),max(0,y0-pad),min(out.width,x1+pad),min(out.height,y1+pad)))

def save_sprite(image, name):
    out=chroma_cut(image)
    out.thumbnail((512,512),Image.Resampling.LANCZOS)
    out.save(ROOT / f'{name}.webp','WEBP',quality=90,method=6)
    print(name, out.size)

for stage in (2,3,4):
    source=Image.open(ROOT / f'stage{stage}-source.png').convert('RGB')
    source.save(ROOT / f'stage{stage}.webp','WEBP',quality=88,method=6)

for pose in ('pilot-flap','pilot-dive'):
    save_sprite(Image.open(ROOT / f'{pose}-source.png'),pose)

save_sprite(Image.open(ROOT / 'birds-final-source.png'), 'birds')

for sheet, names in (
    ('air-sheet-a',('rodan','balloon','plane','cloud')),
    ('air-sheet-b',('gillas','oilrig','chili','can')),
    ('ground-sheet-a',('trampoline','building','vent','bento')),
    ('ground-sheet-b',('dolly_rail','anguirus','canvas','sand')),
    ('ground-sheet-c',('tower','ultraman','water','dolly')),
    ('ground-sheet-d',('chair','cannon','clapper','camera')),
):
    atlas=Image.open(ROOT / f'{sheet}-source.png')
    half_w,half_h=atlas.width//2,atlas.height//2
    for i,name in enumerate(names):
        col,row=i%2,i//2
        cell=atlas.crop((col*half_w,row*half_h,(col+1)*half_w,(row+1)*half_h))
        save_sprite(cell,name)
