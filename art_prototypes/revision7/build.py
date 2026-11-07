"""Apply the generated smile locally, keeping original pose and alpha exact."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
import json
root=Path(__file__).resolve().parent
audit={}; previews=[]
for gender in ['boy','girl']:
    original=Image.open(root.parent/'revision5'/f'opening-hero-{gender}.png').convert('RGBA')
    generated=Image.open(root/f'{gender}-smile-source.png').convert('RGB').resize((290,290),Image.Resampling.LANCZOS)
    ox,oy=770,10 if gender=='boy' else 0
    # Keep the existing eyes, silhouette, body and clothes pixel-for-pixel.
    region=(918,188,1002,246) if gender=='boy' else (922,174,998,224)
    mask=Image.new('L',original.size,0);ImageDraw.Draw(mask).ellipse(region,fill=255)
    mask=mask.filter(ImageFilter.GaussianBlur(3))
    # Generated cheek outlines can move inward slightly. Never blend the
    # magenta outside that outline into the original opaque face silhouette.
    rgb=np.array(generated).astype(int)
    key=(rgb[:,:,0]>90)&(rgb[:,:,2]>90)&(np.minimum(rgb[:,:,0],rgb[:,:,2])-rgb[:,:,1]>35)
    valid=Image.fromarray((~key).astype('uint8')*255).filter(ImageFilter.MinFilter(13)).filter(ImageFilter.GaussianBlur(2))
    weights=np.array(mask);local=weights[oy:oy+290,ox:ox+290]
    local[:]=(local.astype(float)*np.array(valid)/255).astype('uint8');mask=Image.fromarray(weights)
    edited=original.convert('RGB');edited.paste(generated,(ox,oy))
    result=Image.composite(edited,original.convert('RGB'),mask).convert('RGBA')
    result.putalpha(original.getchannel('A'))
    array=np.array(result);array[array[:,:,3]==0]=0;result=Image.fromarray(array)
    outside=np.array(mask)==0
    assert np.array_equal(array[outside],np.array(original)[outside])
    assert np.array_equal(array[:,:,3],np.array(original)[:,:,3])
    result.save(root/f'opening-hero-{gender}.png',optimize=True)
    audit[gender]={'dimensions':list(result.size),'alpha_preserved':True,'outside_face_unchanged':True,'edited_pixels':int(np.any(array!=np.array(original),axis=2).sum())}
    face=result.crop((790,65,1035,280) if gender=='boy' else (790,30,1035,245))
    bg=Image.new('RGBA',face.size,'#38464a');bg.alpha_composite(face)
    previews.append(bg.resize((490,430),Image.Resampling.LANCZOS).convert('RGB'))
preview=Image.new('RGB',(1000,450),'#38464a');preview.paste(previews[0],(5,10));preview.paste(previews[1],(505,10));preview.save(root/'smile-preview.jpg',quality=94)
(root/'edit-audit.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
print(json.dumps(audit))
