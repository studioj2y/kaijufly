from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parent
for gender in ['boy','girl']:
    image=Image.open(root.parent/'revision5'/f'opening-hero-{gender}.png').convert('RGBA')
    box=(770,10,1060,300) if gender=='boy' else (770,0,1060,290)
    crop=image.crop(box)
    background=Image.new('RGBA',crop.size,'#ff00ff');background.alpha_composite(crop)
    background.convert('RGB').resize((1024,1024),Image.Resampling.LANCZOS).save(root/f'reference-{gender}-face.png')
