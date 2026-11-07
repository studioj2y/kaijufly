"""Seven-frame loops, fixed union crops, chroma removal, and direction correction."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps, ImageDraw
import numpy as np

root = Path(__file__).resolve().parent
names = ('boy','girl','moth','rodan','gillas','cloud')
loops=[]
for name in names:
    atlas=Image.open(root/f'{name}-source.png').convert('RGBA')
    w,h=atlas.width//4,atlas.height//2
    frames=[]
    for i in range(7):
        f=atlas.crop((i%4*w,i//4*h,(i%4+1)*w,(i//4+1)*h))
        rgb=np.asarray(f).astype(np.int16)
        r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
        key=(r>110)&(b>100)&(np.minimum(r,b)-g>55)
        alpha=Image.fromarray(np.where(key,0,255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.4))
        f.putalpha(alpha);frames.append(f)
    boxes=[f.getbbox() for f in frames]
    assert all(boxes), f'Empty frame: {name}'
    box=(max(0,min(b[0] for b in boxes)-8),max(0,min(b[1] for b in boxes)-8),min(w,max(b[2] for b in boxes)+8),min(h,max(b[3] for b in boxes)+8))
    exported=[]
    for i,f in enumerate(frames):
        f=f.crop(box);f.thumbnail((512,512),Image.Resampling.LANCZOS)
        f.save(root/f'{name}-frame-{i}.webp','WEBP',quality=90,method=4)
        exported.append(f)
    loops.append(exported)

ImageOps.mirror(Image.open(root.parent/'full_assets'/'plane.webp')).save(root/'plane-right.webp','WEBP',quality=92,method=4)
preview=[]
for i in range(7):
    page=Image.new('RGB',(1080,640),'#29383f')
    d=ImageDraw.Draw(page)
    for j,frames in enumerate(loops):
        f=frames[i].copy();f.thumbnail((325,275),Image.Resampling.LANCZOS)
        x=j%3*360+(360-f.width)//2;y=j//3*320+(320-f.height)//2
        page.paste(f,(x,y),f);d.text((j%3*360+14,j//3*320+10),names[j],fill='#e4d4b0')
    preview.append(page)
# GIF timing is quantized to 10 ms; runtime uses an exact 7fps clock.
preview[0].save(root/'animation-preview.gif',save_all=True,append_images=preview[1:],duration=[140,140,150,140,140,150,140],loop=0,disposal=2)
print('Exported 42 frames, right-facing plane, and preview.')
