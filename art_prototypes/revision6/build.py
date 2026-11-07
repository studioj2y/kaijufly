"""Export level-yaw sprites, reusable ink plaques and unmirrored scenery."""
from pathlib import Path
from PIL import Image, ImageFilter, ImageDraw
import numpy as np
import json

root = Path(__file__).resolve().parent
old = root.parent / 'revision5'
audit = {}

def cut(im, blue=False):
    a = np.array(im.convert('RGB')).astype(float)
    r, g, b = a[:,:,0], a[:,:,1], a[:,:,2]
    key = (r > 45) & (b > 45) & (np.minimum(r,b) - g > 30)
    alpha = np.where(key, 0, 255).astype('uint8')
    if blue:
        bg = np.median(a[:8].reshape(-1,3), axis=0)
        opacity = np.clip(1-(np.minimum(r,b)-g)/max(1,min(bg[0],bg[2])-bg[1]),0,1)
        soft = key & (g > bg[1]+10) & (opacity > .1)
        a[soft] = [145,211,248]; alpha[soft] = (opacity[soft]*255).astype('uint8')
    alpha = np.array(Image.fromarray(alpha).filter(ImageFilter.GaussianBlur(.2)))
    out = np.dstack((a.astype('uint8'),alpha)); out[out[:,:,3] < 3] = 0
    return Image.fromarray(out)

def save(im, name, limit=None):
    if limit: im.thumbnail(limit,Image.Resampling.LANCZOS)
    a=np.array(im.convert('RGBA'));a[a[:,:,3]==0]=0
    im=Image.fromarray(a); im.save(root/name,optimize=True)
    assert np.array_equal(a,np.array(Image.open(root/name)))
    audit[name] = list(im.size)
    return im

def tight(im, pad=8):
    b=im.getbbox();return im.crop((b[0]-pad,b[1]-pad,b[2]+pad,b[3]+pad))

loops={}
for name in ['gamera','anguirus']:
    source=Image.open(root/f'{name}-source.png'); cw,ch=source.width//4,source.height//2
    frames=[cut(source.crop((i%4*cw,i//4*ch,(i%4+1)*cw,(i//4+1)*ch)),name=='gamera') for i in range(7)]
    # Register each shell center, or each walker's ground contact, without any
    # screen-plane rotation. Seven independently painted yaw/gait poses remain.
    registered=[]
    for f in frames:
        # Ignore isolated near-transparent keying specks when locating frames;
        # otherwise one speck can shift the entire shell up/down by half a cell.
        alpha=np.array(f)[:,:,3]
        box=Image.fromarray((alpha>80).astype('uint8')*255).getbbox()
        box=(box[0]-5,box[1]-5,box[2]+5,box[3]+5); f=f.crop(box)
        x=(cw-f.width)//2
        y=ch-18-f.height if name=='anguirus' else (ch-f.height)//2
        c=Image.new('RGBA',(cw,ch));c.alpha_composite(f,(x,y));registered.append(c)
    boxes=[im.getbbox() for im in registered]
    common=(min(b[0] for b in boxes)-6,min(b[1] for b in boxes)-6,max(b[2] for b in boxes)+6,max(b[3] for b in boxes)+6)
    loops[name]=[save(f.crop(common),f'{name}-frame-{i}.png',(512,512)) for i,f in enumerate(registered)]
    if name=='gamera':
        centers=[]
        for f in loops[name]:
            b=Image.fromarray((np.array(f)[:,:,3]>100).astype('uint8')*255).getbbox()
            centers.append((b[1]+b[3])/2)
        assert max(centers)-min(centers)<=2,centers

save(tight(cut(Image.open(root/'cannon-source.png'))),'human-cannon.png',(800,800))
source=Image.open(root/'title-source.png')
for i in range(2):
    save(tight(cut(source.crop((0,i*512,source.width,(i+1)*512)))),'title-plate-'+str(i)+'.png',(1100,320))
source=Image.open(root/'decor-source.png');cw,ch=source.width//4,source.height//2
for i in range(8):
    save(tight(cut(source.crop((i%4*cw,i//4*ch,(i%4+1)*cw,(i//4+1)*ch)))),'decor-'+str(i)+'.png',(512,360))

# Recover the original one-way panoramas rather than their mirror-concatenated exports.
spans={'day':[(0,575),(580,978),(985,1536)],'sunset':[(0,510),(516,1006),(1012,1536)],
       'night':[(20,510),(522,1012),(1024,1516)],'moon':[(0,511),(517,1022),(1029,1536)]}
for stage,rows in spans.items():
    source=Image.open(old/f'parallax-{stage}-source.png');margin=20 if stage=='night' else 0
    for i,(top,bottom) in enumerate(rows):
        layer=source.crop((margin,top,source.width-margin,bottom))
        layer=layer.convert('RGBA') if i==0 else cut(layer)
        # One-sided feather lets randomized segments overlap without doubled
        # opaque seams. Opposite edges are NEVER reflected or paired.
        a=np.array(layer);fade=np.minimum(1,np.arange(layer.width)/(layer.width*.12))
        a[:,:,3]=(a[:,:,3]*fade[None,:]).astype('uint8')
        save(Image.fromarray(a),f'parallax-{stage}-{i}.png',(1536,575))

source=Image.open(old/'ground-source.png')
for i,(top,bottom) in enumerate([(405,505),(910,990),(1420,1535)]):
    layer=source.crop((400,top,1120,bottom)).convert('RGBA')
    a=np.array(layer);a[:,:,3]=(a[:,:,3]*np.minimum(1,np.arange(layer.width)/90)[None,:]).astype('uint8')
    save(Image.fromarray(a),f'floor-texture-{i}.png')

# Existing bespoke riding ending, now travelling in the same direction as play.
for gender in ['boy','girl']:
    for i in range(7):
        im=Image.open(old/f'ending-anguirus-{gender}-{i}.png')
        im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        # The old atlas crop retained a piece of its neighboring cell. Bounds
        # below were checked against connected silhouettes, keeping the full
        # rider/monster and clearing only the detached fragment at the right.
        edges={'boy':[423,356,322,328,349,368,368],'girl':[423,356,322,328,349,368,395]}
        a=np.array(im);a[:,edges[gender][i]+3:]=0
        save(Image.fromarray(a),f'ending-anguirus-{gender}-{i}.png')

manifest=json.loads((old/'manifest.js').read_text().split(' = ',1)[1].rstrip(';\n'))
manifest['groundRatios']['anguirus']=loops['anguirus'][0].width/loops['anguirus'][0].height
(root/'manifest.js').write_text('window.kaijuSceneAssets = '+json.dumps(manifest)+';\n',encoding='utf8')
(root/'alpha-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
preview=[]
for i in range(7):
    im=Image.new('RGBA',(1000,470),'#314248');d=ImageDraw.Draw(im)
    for n,name in enumerate(['gamera','anguirus']):
        f=loops[name][i];im.alpha_composite(f,((500-f.width)//2+n*500,(470-f.height)//2))
        d.text((n*500+20,20),name,fill='#eddfc5')
    preview.append(im.convert('RGB'))
preview[0].save(root/'animation-preview.gif',save_all=True,append_images=preview[1:],duration=143,loop=0)
print(f'Exported {len(audit)} clean RGBA assets without mirrored scenery or in-plane shell rotation.')
