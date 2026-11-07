"""Extract four fixed-registration frames from each 2x2 animation sheet."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
import numpy as np

root = Path(__file__).resolve().parent
all_frames = []
for name in ('pilot', 'moth', 'rodan'):
    atlas = Image.open(root / f'{name}-animation-source.png').convert('RGBA')
    w, h = atlas.width // 2, atlas.height // 2
    frames = []
    for i in range(4):
        frame = atlas.crop(((i % 2)*w, (i//2)*h, (i%2+1)*w, (i//2+1)*h))
        rgb = np.asarray(frame).astype(np.int16)
        r, g, b = rgb[:,:,0], rgb[:,:,1], rgb[:,:,2]
        mask = (r > 120) & (b > 120) & (np.minimum(r,b) - g > 60)
        alpha = Image.fromarray(np.where(mask,0,255).astype('uint8')).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.4))
        frame.putalpha(alpha)
        frames.append(frame)
    boxes = [f.getbbox() for f in frames]
    # One union crop preserves registration and scale throughout the loop.
    box = (max(0,min(b[0] for b in boxes)-10), max(0,min(b[1] for b in boxes)-10), min(w,max(b[2] for b in boxes)+10), min(h,max(b[3] for b in boxes)+10))
    exported=[]
    for i, frame in enumerate(frames):
        frame=frame.crop(box)
        frame.thumbnail((512,512),Image.Resampling.LANCZOS)
        frame.save(root / f'{name}-frame-{i}.webp','WEBP',quality=90,method=6)
        exported.append(frame)
    all_frames.append(exported)

preview=[]
for i in range(4):
    page=Image.new('RGB',(960,400),'#26343c')
    for j, frames in enumerate(all_frames):
        f=frames[i].copy(); f.thumbnail((290,300),Image.Resampling.LANCZOS)
        page.paste(f,(j*320+(320-f.width)//2,(400-f.height)//2),f)
    preview.append(page)
preview[0].save(root/'animation-preview.gif',save_all=True,append_images=preview[1:],duration=250,loop=0,disposal=2)
print('Exported 12 animation frames and 4 fps preview.')
