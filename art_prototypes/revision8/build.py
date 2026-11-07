"""Export registered seven-frame loops and full-scene souvenir photographs."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
import json
p=Path(__file__).resolve().parent
audit={}
def cut(im):
    a=np.array(im.convert('RGB')).astype(float); r,g,b=a[:,:,0],a[:,:,1],a[:,:,2]
    key=(r>45)&(b>45)&(np.minimum(r,b)-g>30)
    alpha=np.where(key,0,255).astype('uint8')
    # Recover blue light spilling into the magenta key without a pink fringe.
    bg=np.median(a[:5].reshape(-1,3),axis=0)
    opacity=np.clip(1-(np.minimum(r,b)-g)/max(1,min(bg[0],bg[2])-bg[1]),0,1)
    soft=key&(g>bg[1]+20)&(opacity>.14)&(b>r+8)
    a[soft]=[142,220,252];alpha[soft]=(opacity[soft]*255).astype('uint8')
    alpha=np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.18)))
    out=np.dstack((a.astype('uint8'),alpha));out[out[:,:,3]<4]=0
    return Image.fromarray(out)
def bbox(im):return Image.fromarray((np.array(im)[:,:,3]>80).astype('uint8')*255).getbbox()
def tight(im):
    b=bbox(im);return im.crop((b[0]-5,b[1]-5,b[2]+5,b[3]+5))
def save(im,name,limit=None):
    if limit:im.thumbnail(limit,Image.Resampling.LANCZOS)
    a=np.array(im);a[a[:,:,3]==0]=0;im=Image.fromarray(a)
    im.save(p/name,optimize=True);audit[name]=list(im.size);return im
for name in ['godzilla','gamera','anguirus']:
    src=p/('opening-'+name+'-source.png')
    if src.exists():save(tight(cut(Image.open(src))),'opening-'+name+'.png',(1200,1100))
loops={}
for name in ['oilrig','gamera','anguirus','can']:
    src=p/(name+'-source.png')
    if not src.exists():continue
    source=Image.open(src);cw,ch=source.width//4,source.height//2
    registered=[]
    for i in range(7):
        f=tight(cut(source.crop((i%4*cw,i//4*ch,(i%4+1)*cw,(i//4+1)*ch))))
        c=Image.new('RGBA',(cw+20,ch+20))
        y=ch+10-f.height if name in ['oilrig','anguirus'] else (ch+20-f.height)//2
        c.alpha_composite(f,((cw+20-f.width)//2,y));registered.append(c)
    boxes=[bbox(im) for im in registered]
    common=(min(b[0] for b in boxes)-5,min(b[1] for b in boxes)-5,max(b[2] for b in boxes)+5,max(b[3] for b in boxes)+5)
    loops[name]=[save(f.crop(common),f'{name}-frame-{i}.png',(560,560)) for i,f in enumerate(registered)]
    if name=='gamera':
        centers=[(bbox(f)[1]+bbox(f)[3])/2 for f in loops[name]]
        assert max(centers)-min(centers)<=2,centers
src=p/'ending-anguirus-repair-source.png'
if src.exists():
    source=Image.open(src);cw,ch=source.width//4,source.height//4
    for g,gender in enumerate(['boy','girl']):
        frames=[]
        for i in range(7):
            cell=g*8+i
            frames.append(cut(source.crop((cell%4*cw,cell//4*ch,(cell%4+1)*cw,(cell//4+1)*ch))))
        # Fixed canvas preserves the authored approach/riding staging.
        for i,f in enumerate(frames):save(f,f'ending-anguirus-{gender}-{i}.png')
for src in p.glob('photo-*-source.png'):
    name=src.name.removeprefix('photo-').removesuffix('-source.png')
    if name.endswith('-repair'):continue
    repair=p/f'photo-{name}-repair-source.png'
    im=Image.open(repair if repair.exists() else src).convert('RGB')
    for i,g in enumerate(['boy','girl']):
        f=im.crop((i*im.width//2,0,(i+1)*im.width//2,im.height));f=f.resize((768,768),Image.Resampling.LANCZOS)
        f.save(p/f'photo-{name}-{g}.jpg',quality=91,subsampling=0)
# Preserve all ending illustrations as complete, framed-scene album photographs.
for name in ['canvas','anguirus','sand','tower','ultraman','water','dolly','chair']:
    for gender in ['boy','girl']:
        folder=p if name=='anguirus' else p.parent/'revision5'
        src=folder/f'ending-{name}-{gender}-6.png'
        if not src.exists():continue
        bg=Image.open(p.parent/'revision5/opening-background.jpg').convert('RGB')
        side=min(bg.size);bg=bg.crop(((bg.width-side)//2,0,(bg.width+side)//2,side)).resize((768,768))
        bg=Image.blend(bg,Image.new('RGB',bg.size,'#e5dac2'),.55)
        f=tight(Image.open(src).convert('RGBA'));f.thumbnail((690,650),Image.Resampling.LANCZOS)
        bg.paste(f,((768-f.width)//2,715-f.height),f)
        bg.save(p/f'ending-photo-{name}-{gender}.jpg',quality=91,subsampling=0)
manifest=json.loads((p.parent/'revision6/manifest.js').read_text().split(' = ',1)[1].rstrip(';\n'))
if 'anguirus' in loops:manifest['groundRatios']['anguirus']=loops['anguirus'][0].width/loops['anguirus'][0].height
if 'oilrig' in loops:manifest['groundAnchors']['oilrig']=[bbox(f)[3]/f.height for f in loops['oilrig']]
(p/'manifest.js').write_text('window.kaijuSceneAssets = '+json.dumps(manifest)+';\n',encoding='utf8')
(p/'alpha-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
if len(loops)==4:
    gif=[]
    for i in range(7):
        im=Image.new('RGBA',(1200,650),'#39494f');d=ImageDraw.Draw(im)
        for j,name in enumerate(loops):
            f=loops[name][i].copy();f.thumbnail((560,280));x=j%2*600;y=j//2*325
            im.alpha_composite(f,(x+(600-f.width)//2,y+30+(280-f.height)//2));d.text((x+15,y+10),name,fill='#f0e3c8')
        gif.append(im.convert('RGB'))
    gif[0].save(p/'animation-preview.gif',save_all=True,append_images=gif[1:],duration=143,loop=0)
    gif[0].save(p/'art-preview.jpg',quality=92)
photos=sorted(p.glob('photo-*-boy.jpg'))
if photos:
    im=Image.new('RGB',(1200,((len(photos)+4)//5)*270),'#27353a');d=ImageDraw.Draw(im)
    for i,file in enumerate(photos):
        f=Image.open(file);f.thumbnail((230,230));x=i%5*240;y=i//5*270
        im.paste(f,(x+5,y+5));d.text((x+8,y+240),file.stem.replace('photo-','').replace('-boy',''),fill='#eadbc0')
    im.save(p/'souvenir-preview.jpg',quality=92)
print('Exported',len(audit),'RGBA assets;',len(photos)*2,'souvenirs.')
