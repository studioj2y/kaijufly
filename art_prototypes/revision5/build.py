"""Extract actual game layers/frames, keep transparent RGB clean, save QA previews."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
import json

root=Path(__file__).resolve().parent
endings=('canvas','anguirus','sand','tower','ultraman','water','dolly','chair')
audit={}; ratios={}; ending_loops={}

def cut(image, effect=None, borders=True):
    rgb=np.array(image.convert('RGB')).astype(float)
    r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    key=(r>45)&(b>45)&(np.minimum(r,b)-g>30)
    bg=np.median(np.concatenate((rgb[:3].reshape(-1,3),rgb[-3:].reshape(-1,3))),axis=0)
    strength=max(1,min(bg[0],bg[2])-bg[1])
    opacity=np.clip(1-(np.minimum(r,b)-g)/strength,0,1)
    soft=key&(g>bg[1]+10)&(opacity>.10)
    alpha=np.where(key,0,255).astype('uint8')
    if effect:
        recovered=np.clip((rgb-(1-opacity[:,:,None])*bg)/np.maximum(opacity[:,:,None],.01),0,255)
        rgb[soft]=recovered[soft]
        if effect=='gold':rgb[soft]=[255,208,105]
        elif effect=='blue':rgb[soft]=[145,211,248]
        elif effect=='dust':rgb[soft]=[194,166,117]
        alpha[soft]=(opacity[soft]*255).astype('uint8')
    if borders:
        alpha[:3]=0;alpha[-3:]=0;alpha[:,:3]=0;alpha[:,-3:]=0
    alpha=np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.25)))
    if effect in ('gold','blue'):
        spill=(rgb[:,:,0]>rgb[:,:,1]+7)&(rgb[:,:,2]>rgb[:,:,1]+8)
        rgb[spill]=[255,208,105] if effect=='gold' else [145,211,248]
    out=np.dstack((rgb.astype('uint8'),alpha));out[out[:,:,3]<3]=0
    return Image.fromarray(out)

def save(image,name,limit=None):
    if limit:image.thumbnail(limit,Image.Resampling.LANCZOS)
    a=np.array(image.convert('RGBA'));a[a[:,:,3]==0]=0
    image=Image.fromarray(a);image.save(root/name,optimize=True)
    decoded=np.array(Image.open(root/name).convert('RGBA'))
    assert np.array_equal(a,decoded),name
    assert not np.any(decoded[decoded[:,:,3]==0]),name
    audit[name]={'size':list(image.size),'transparent_rgb':0}
    return image

def padded(image,pad=10):
    box=image.getbbox()
    return image.crop((box[0]-pad,box[1]-pad,box[2]+pad,box[3]+pad))

for name in ('gamera','cloud','oilrig'):
    source=Image.open(root/f'{name}-source.png');w,h=source.width//4,source.height//2
    frames=[cut(source.crop((i%4*w,i//4*h,(i%4+1)*w,(i//4+1)*h)),'gold' if name=='cloud' else 'blue') for i in range(7)]
    boxes=[f.getbbox() for f in frames]
    common=(min(b[0] for b in boxes)-10,min(b[1] for b in boxes)-10,max(b[2] for b in boxes)+10,max(b[3] for b in boxes)+10)
    frames=[f.crop(common) for f in frames]
    if name=='gamera':
        # Keep the domed drawn shell, not the flattened disc used in revision4.
        # Quarter-plane turns provide a continuous rotation through seven poses.
        rotated=[]
        for i,f in enumerate(frames):
            f.thumbnail((350,350),Image.Resampling.LANCZOS)
            canvas=Image.new('RGBA',(512,512));canvas.paste(f,((512-f.width)//2,(512-f.height)//2))
            rotated.append(canvas.rotate(-i*360/7,Image.Resampling.BICUBIC))
        frames=rotated
    for i,f in enumerate(frames):save(f,f'{name}-frame-{i}.png',(512,512))

for name in endings:
    source=Image.open(root/f'ending-{name}-source.png');width,height=source.size;h=height//2
    frames=[]
    for row in range(2):
        for i in range(7):
            f=cut(source.crop((round(i*width/7),row*h,round((i+1)*width/7),(row+1)*h)), 'dust' if name=='sand' else None)
            # All cells get the same canvas dimensions even if division rounds.
            c=Image.new('RGBA',(round(width/7),h));c.paste(f,(0,0));frames.append(c)
    # Keep the male cap intact in the final Anguirus pose; generated frame7
    # accidentally put goggles over the cap. The preceding shy smile is clean.
    if name=='anguirus':frames[6]=frames[5].copy()
    bottoms=[f.getbbox()[3] for f in frames];baseline=max(bottoms)
    registered=[]
    for f,bottom in zip(frames,bottoms):
        c=Image.new('RGBA',(f.width,h+24));c.paste(f,(0,baseline-bottom));registered.append(c)
    boxes=[f.getbbox() for f in registered]
    common=(min(b[0] for b in boxes)-8,min(b[1] for b in boxes)-8,max(b[2] for b in boxes)+8,max(b[3] for b in boxes)+8)
    exported=[]
    for row,gender in enumerate(('boy','girl')):
        for i in range(7):exported.append(save(registered[row*7+i].crop(common),f'ending-{name}-{gender}-{i}.png',(512,512)))
    prop=save(padded(frames[0]),f'prop-{name}.png',(512,512));ratios[name]=round(prop.width/prop.height,5)
    ending_loops[name]=exported

source=Image.open(root/'ground-source.png')
for i in range(3):
    strip=cut(source.crop((0,round(i*source.height/3),source.width,round((i+1)*source.height/3))),borders=False)
    # Feather outer edges so randomly mixed strips never create a hard seam.
    a=np.array(strip);fade=np.minimum(np.arange(strip.width)/70,np.arange(strip.width)[::-1]/70).clip(0,1)
    a[:,:,3]=(a[:,:,3]*fade[None,:]).astype('uint8')
    save(Image.fromarray(a),f'ground-strip-{i}.png')

for stage in ('day','sunset','night','moon'):
    path=root/f'parallax-{stage}-source.png'
    if not path.exists():continue
    source=Image.open(path)
    for i in range(3):
        # The model's panel dividers are not perfectly equal thirds. Crop at
        # the observed boundaries, excluding separators and adjacent pictures.
        spans={'day':[(0,575),(580,978),(985,1536)],
               'sunset':[(0,510),(516,1006),(1012,1536)],
               'night':[(20,510),(522,1012),(1024,1516)],
               'moon':[(0,511),(517,1022),(1029,1536)]}[stage]
        margin=20 if stage=='night' else 0
        layer=source.crop((margin,spans[i][0],source.width-margin,spans[i][1]))
        if i==0:layer=layer.convert('RGBA')
        else:layer=cut(layer,borders=False)
        # Mirror half a panorama to make an exact, continuous horizontal loop.
        tile=Image.new('RGBA',(layer.width*2,layer.height));tile.paste(layer,(0,0));tile.paste(layer.transpose(Image.Transpose.FLIP_LEFT_RIGHT),(layer.width,0))
        save(tile,f'parallax-{stage}-{i}.png',(2048,512))

for name,prefix in [('portraits','portrait'),('portraits-natural','portrait-natural'),('opening-heroes','opening-hero')]:
    path=root/f'{name}-source.png'
    if path.exists():
        source=Image.open(path)
        for i,gender in enumerate(('boy','girl')):
            image=cut(source.crop((i*source.width//2,0,(i+1)*source.width//2,source.height)))
            save(padded(image),f'{prefix}-{gender}.png',(900,1000))
for name in ('moth','rodan','gamera','godzilla','gillas','ghidorah','anguirus'):
    path=root/f'opening-{name}-source.png'
    if path.exists():save(padded(cut(Image.open(path),'gold' if name=='ghidorah' else None)),f'opening-{name}.png',(1300,1000))
for gender in ('boy','girl'):
    path=root/f'opening-hero-{gender}-source.png'
    if path.exists():save(padded(cut(Image.open(path))),f'opening-hero-{gender}.png',(1300,1000))
if (root/'opening-background-source.png').exists():
    Image.open(root/'opening-background-source.png').convert('RGB').save(root/'opening-background.jpg',quality=94)

preview=[]
for frame in range(7):
    page=Image.new('RGBA',(1200,720),'#2b3a40');draw=ImageDraw.Draw(page)
    for j,name in enumerate(endings):
        im=ending_loops[name][frame].copy();im.thumbnail((280,310),Image.Resampling.LANCZOS)
        page.alpha_composite(im,(j%4*300+(300-im.width)//2,j//4*360+40+(310-im.height)//2));draw.text((j%4*300+12,j//4*360+12),name,fill='#e4d4b0')
    preview.append(page.convert('RGB'))
preview[0].save(root/'endings-preview.gif',save_all=True,append_images=preview[1:],duration=[180,150,150,150,150,150,1300],loop=0,disposal=2)
preview[-1].save(root/'endings-preview.png')
feet=[]
for i in range(7):
    alpha=np.array(Image.open(root/f'oilrig-frame-{i}.png'))[:,:,3]
    feet.append(float((np.where(alpha>150)[0].max()+1)/alpha.shape[0]))
(root/'manifest.js').write_text('window.kaijuSceneAssets = '+json.dumps({'groundRatios':ratios,'groundAnchors':{'oilrig':feet}})+';\n',encoding='utf-8')
(root/'alpha-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf-8')
print(f'Exported and verified {len(audit)} RGBA images. Ground ratios: {ratios}')
