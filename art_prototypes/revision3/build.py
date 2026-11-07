"""Export seven-frame sprites with stronger keying and a clean transparent border."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
import json

root=Path(__file__).resolve().parent
names=('boy','girl','moth','rodan','gillas','cloud')
loops=[]
grips={}
anchors={
    'rodan':[(.33,.89),(.33,.90),(.29,.90),(.27,.90),(.44,.69),(.35,.70),(.36,.71)],
    'moth':[(.60,.88),(.60,.88),(.60,.90),(.60,.91),(.60,.77),(.60,.85),(.60,.88)]
}
report={'old_magenta_pixels':{},'new_magenta_pixels':{},'frame_boxes':{}}
def magenta(rgb):
    r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    return (r>45)&(b>45)&(np.minimum(r,b)-g>30)
for p in (root.parent/'revision2').glob('*-frame-*.webp'):
    a=np.array(Image.open(p).convert('RGBA')).astype(np.int16)
    n=int(np.sum(magenta(a)&(a[:,:,3]>80)))
    if n: report['old_magenta_pixels'][p.name]=n
for name in names:
    source=root/f'{name}-source.png'
    if name=='moth': source=root.parent/'revision2'/'moth-source.png'
    atlas=Image.open(source).convert('RGBA');w,h=atlas.width//4,atlas.height//2
    frames=[]
    for i in range(7):
        f=atlas.crop((i%4*w,i//4*h,(i%4+1)*w,(i//4+1)*h))
        rgb=np.array(f).astype(np.int16)
        key=magenta(rgb)
        rgba=np.array(f)
        alpha_values=np.where(key,0,255).astype('uint8')
        if name in ('gillas','cloud'):
            # Recover translucent wind/light instead of cutting out its pink-
            # contaminated antialiasing. The green channel separates it from
            # the saturated chroma backdrop.
            bg=np.median(np.concatenate((rgb[0,:,:3],rgb[-1,:,:3])),axis=0)
            strength=max(1,float(min(bg[0],bg[2])-bg[1]))
            opacity=np.clip(1-(np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1])/strength,0,1)
            soft=key&(rgb[:,:,1]>25)&(opacity>.06)
            recovered=np.clip((rgb[:,:,:3]-(1-opacity[:,:,None])*bg)/np.maximum(opacity[:,:,None],.01),0,255)
            rgba[:,:,:3][soft]=recovered[soft].astype('uint8')
            if name=='gillas': rgba[:,:,:3][soft]=[214,203,179]
            alpha_values[soft]=(opacity[soft]*255).astype('uint8')
            key=key&~soft
        # Guard the atlas boundary against neighboring cells and stray edge blocks.
        key[:3,:]=True;key[-3:,:]=True;key[:,:3]=True;key[:,-3:]=True
        alpha_values[key]=0
        alpha=Image.fromarray(alpha_values)
        if name not in ('gillas','cloud'): alpha=alpha.filter(ImageFilter.MinFilter(3))
        alpha=alpha.filter(ImageFilter.GaussianBlur(0.35))
        rgba[:,:,3]=np.array(alpha)
        rgba[key]=0
        f=Image.fromarray(rgba);frames.append(f)
    boxes=[f.getbbox() for f in frames]
    box=(max(0,min(b[0] for b in boxes)-8),max(0,min(b[1] for b in boxes)-8),min(w,max(b[2] for b in boxes)+8),min(h,max(b[3] for b in boxes)+8))
    report['frame_boxes'][name]=box
    frames=[f.crop(box) for f in frames]
    if name in anchors:
        # Register the actual talon tips; wing pose must not move the passenger.
        fw,fh=frames[0].size
        registered=[]
        for f,(gx,gy) in zip(frames,anchors[name]):
            canvas=Image.new('RGBA',(fw*3,fh*3))
            canvas.paste(f,(round(fw-gx*fw),round(fh-gy*fh)))
            registered.append(canvas)
        boxes=[f.getbbox() for f in registered]
        common=(min(b[0] for b in boxes)-8,min(b[1] for b in boxes)-8,max(b[2] for b in boxes)+8,max(b[3] for b in boxes)+8)
        grips[name]={'x':round((fw-common[0])/(common[2]-common[0]),4),'y':round((fh-common[1])/(common[3]-common[1]),4)}
        frames=[f.crop(common) for f in registered]
    exported=[]
    for i,f in enumerate(frames):
        f.thumbnail((512,512),Image.Resampling.LANCZOS)
        a=np.array(f);bad=magenta(a.astype(np.int16));a[bad]=0
        # Zero transparent RGB so filtering cannot leak the key color back in.
        a[a[:,:,3]==0]=0;f=Image.fromarray(a)
        path=root/f'{name}-frame-{i}.webp'
        f.save(path,'WEBP',lossless=True,method=4)
        count=int(np.sum(magenta(np.array(f).astype(np.int16))&(a[:,:,3]>0)))
        assert count==0,path
        assert not np.any(a[:2,:,3]) and not np.any(a[-2:,:,3]) and not np.any(a[:,:2,3]) and not np.any(a[:,-2:,3]),path
        report['new_magenta_pixels'][path.name]=count
        exported.append(f)
    loops.append(exported)
preview=[]
for i in range(7):
    page=Image.new('RGB',(1080,640),'#29383f');d=ImageDraw.Draw(page)
    for j,frames in enumerate(loops):
        f=frames[i].copy();f.thumbnail((325,275),Image.Resampling.LANCZOS)
        x=j%3*360+(360-f.width)//2;y=j//3*320+(320-f.height)//2
        page.paste(f,(x,y),f);d.text((j%3*360+14,j//3*320+10),names[j],fill='#e4d4b0')
    preview.append(page)
preview[0].save(root/'animation-preview.gif',save_all=True,append_images=preview[1:],duration=[140,140,150,140,140,150,140],loop=0,disposal=2)
(root/'alpha-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
(root/'grip-points.json').write_text(json.dumps(grips,indent=2),encoding='utf-8')
print('Registered grip points:',grips)
print('42 frames verified: no magenta residue, all borders transparent.')
print('Previous frames with key-color residue:',len(report['old_magenta_pixels']))
