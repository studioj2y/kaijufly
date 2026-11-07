"""Persist art briefs and reference sheets; generation uses the bundled CLI."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
p=Path(__file__).resolve().parent
style='Japanese Heisei tokusatsu practical creature suit realism, expressive sumi-e ink edges and fine manga crosshatching, cinematic ochre charcoal muted olive and icy blue, richly hand-painted material, consistent with reference art. No text, labels, watermark or panel lines.'
godzilla='Japanese HEISEI Godzilla 1991-1994: upright pear-shaped suit body, powerful thighs, short round feline muzzle, pronounced brow, small warm amber eyes, thick neck, pebbled charcoal rubber skin, three rows of large pale ivory maple-leaf dorsal plates. NOT Legendary/MonsterVerse, NOT crocodile muzzle, NOT tiny blue dorsal triangles, not burning Godzilla.'
gamera='Heisei Gamera trilogy (1995-1999) flying shell: dark olive-black natural keratin, densely overlapping irregular flattened ridged scutes, layered serrated shell rim, continuous organic low domed oval shell, weathered asymmetry. Four limbs AND head fully retracted into shell for spinning flight, four brilliant curved blue jet flames issuing from limb sockets. NO visible head or limbs. NOT stone paving, NOT a faceted geometric gemstone, NOT a regular hexagonal turtle grid. Shell stays horizontal, camera 20 degrees above edge, very wide flat ellipse. Spins in yaw about vertical axis, never rolls in the image plane.'
anguirus='Anguirus, low four-legged dinosaur suit, long trailing tail, horned snout, ivory crown horns. Back densely covered with 45-60 very long pointed curved ivory conical spikes, different lengths with largest spikes almost head-height, dramatic spiny silhouette. Many more and much longer spikes than old reference. Warm dark olive-brown organic armor. Faces and walks RIGHT.'
jobs=[]
def job(name,brief,refs,size='2048x1024'):
    (p/(name+'-prompt.txt')).write_text('Use case: precise-object-edit / illustration-story\n'+brief+'\nStyle: '+style,encoding='utf8')
    jobs.append(dict(name=name,refs=refs,size=size))
for name,desc,ref in [('godzilla',godzilla,'reference-godzilla.jpg'),('gamera',gamera,'reference-gamera.jpg'),('anguirus',anguirus,None)]:
    refs=['../revision5/opening-'+name+'.png']+([ref] if ref else [])
    job('opening-'+name,'Redraw the first reference as a premium isolated opening poster monster. Image 1 is composition/style reference; image 2 where present is actual film anatomy reference. Keep dramatic three-quarter looming presence facing LEFT toward incoming child, entire creature with margin. '+desc.replace('Faces and walks RIGHT.','Faces LEFT.')+' Background absolutely flat pure magenta #ff00ff. No ground, no cast shadow, no separate fragments. All appendages inside image with 40px clear margin.',refs,'1536x1024')
atlas='Make a clean animation sprite sheet, exactly 4 columns by 2 rows of equal 512x512 cells. Seven frames in reading order, eighth cell EMPTY MAGENTA. Every frame independent centered fully visible with 35px empty margin, consistent scale and baseline. Pure flat magenta #ff00ff background, no panel lines, no ground shadow, no detached debris. '
job('oilrig',atlas+'Image 1 is old animation composition reference; image 2 correct anatomy. '+godzilla+' Full body standing planted, head angled UP, broad long brilliant blue-white atomic breath extending vertically above its head, body occupies lower 60% of each cell, beam upper 40%. Seven distinct subtle breathing poses and pulsing beam. Keep both feet at same baseline.', ['../revision5/oilrig-source.png','reference-godzilla.jpg'])
job('gamera',atlas+'Image 1 previous gameplay animation; image 2 original Heisei flying model anatomy/material reference. '+gamera+' Seven yaw orientations separated by 51.4 degrees, flames sweep horizontally around shell, always same ellipse proportions and center. Shell centered, entire blue jets inside each cell.', ['../revision6/gamera-source.png','reference-gamera.jpg'])
job('anguirus',atlas+anguirus+' Seven evenly spaced phases of a slow quadruped gait, all feet grounded on same invisible baseline. Preserve style and orientation of reference. Full tail and all spikes inside each cell. No rider.', ['../revision6/anguirus-source.png'])
job('can',atlas+'Reference is Ultraman Color Timer. Redraw as a glowing oval cyan-blue lens in a thick brushed silver bezel, iconic raised convex luminous dome, tiny red-silver chest-shaped backing. Seven subtle pulse phases bright-dim-bright, same silhouette and center. Stylized painted collectible, no battery switches, no writing, no beverage can, no drink. Cyan glow cleanly bounded away from cell edges.', ['reference-timer.jpg'])
# Clean existing ending frames for identity and sequence reference.
sheet=Image.new('RGB',(2048,2048),'#ff00ff')
for row,g in enumerate(['boy','girl']):
    for i in range(7):
        im=Image.open(p.parent/'revision6'/f'ending-anguirus-{g}-{i}.png').convert('RGBA');im.thumbnail((450,450))
        cell=row*8+i;sheet.paste(im,(cell%4*512+(512-im.width)//2,cell//4*512+490-im.height),im)
sheet.save(p/'reference-anguirus-ending.png')
job('ending-anguirus','Edit this exact 4x4 grid ending animation: first 7 cells boy, cell 8 empty; next 7 cells girl, cell16 empty. Preserve the two children identities, face moods, intact clothing, red cap boy / goggles girl, and the approach then gently riding ending sequence. '+anguirus+' Change monster back to spectacular much longer and more numerous ivory spikes throughout all 14 frames. Children sit safely between spines, no injury, no ripped clothing. Retain equal cells and clear 30px margins. Pure magenta background, no text, no detached fragments. Seven sequential frames per gender, full figures in each cell.', ['reference-anguirus-ending.png'],'2048x2048')
# Identity references for the souvenir set.
sheet=Image.new('RGB',(1536,768),'#e4d8bf')
for i,g in enumerate(['boy','girl']):
    im=Image.open(p.parent/'revision7'/f'opening-hero-{g}.png').convert('RGBA');im.thumbnail((740,700));sheet.paste(im,(i*768+(768-im.width)//2,(768-im.height)//2),im)
sheet.save(p/'reference-visitors.png')
scenes={
 'cloud':'Child with static-frizzed hair and joyful startled grin poses giving V sign under dark thundercloud; large branching golden gravity rays arc around, three faint Ghidorah dragon-head silhouettes hinted in the cloud, costume sleeves ruffled, safe film-set effects.',
 'rodan':'Right-facing reddish-brown Japanese Rodan gently catches the child by backpack straps in its visible talons, child dangles exhilarated, cap/goggles askew, one hand waving at camera, miniature city far below.',
 'mothra':'Huge gentle Mothra with orange black cream patterned wings flutters behind the child, furry legs support backpack, golden healing scales dust cheeks, delighted laughing child waves to camera.',
 'gamera':gamera+' Child rides the blue jet slipstream just above shell, clings awkwardly with both hands to backpack straps, delighted surprised smile, cheeks wind-squashed, shell fills background, miniature studio city.',
 'plane':'Japanese tokusatsu silver red jet flies RIGHT just behind excited child caught in its slipstream, child waves to camera with hair and clothing blown sideways, slightly comic awkward flying pose, studio skyline.',
 'gillas':'Black Gillas and Red Gillas two Japanese horned bipedal monsters clasp each other face to face inside dense cyclone, long back horns visible. Child spirals with wind, hair tousled, delighted dizzy grin and V sign at camera, small blue lightning threads, miniature city.',
 'oilrig':godzilla+' Head tilted UP sending thick long blue atomic beam into sky. Child swept up safely beside beam, blue-lit face, one hand holds cap/goggles, other waves at camera with exhilarated grin; behind-scenes miniature buildings.',
 'chili':'Child tries a masked-rider-themed red green wrapped propulsion candy, cheeks puffed with surprise, colorful harmless prop smoke behind backpack, grinning awkwardly at camera on miniature movie set.',
 'can':'Child hugs an oversized Ultraman Color Timer to chest: luminous oval cyan blue convex jewel and silver bezel, blue light on joyful curious face, messy hair, glowing specks, miniature studio interior. NOT a drink can.',
 'birds':'Several tiny Baltan alien puppets with silver lobster claws and orange eyes surround child in midair, one clings to backpack, child laughs and awkwardly gives V sign to camera amid tangled puppet strings, studio city.',
 'trampoline':'Child bounces above huge olive rubber monster-belly trampoline on visible studio metal frame and springs, hair vertical, one shoe slightly slipping but still on, laughing to camera, soundstage tools behind.',
 'building':'Child emerges through a harmless breakaway cardboard miniature office tower, cardboard roof stuck on shoulder like hat, laughing awkwardly and V sign, foam dust, studio lamps behind.',
 'vent':'Studio steam vent lifts child gently in white and blue vapor, goggles/cap pushed sideways, delighted startled smile, arms flailing into a V sign, practical pipes and miniature city behind.',
 'bento':'Child eagerly hugs a big film-crew bento lunch box, rice grain on smiling cheek, colorful food wobbling, slightly messy clothes, production lunch table and miniature buildings behind.',
 'dolly_rail':'Child balances awkwardly standing on camera dolly rolling along metal studio rails, laughing toward camera holding the large vintage movie camera for balance, scarf/vest windblown, set equipment.'}
for name,scene in scenes.items():
    refs=['reference-visitors.png']
    if name=='oilrig':refs+=['reference-godzilla.jpg']
    if name=='gamera':refs+=['reference-gamera.jpg']
    if name=='can':refs+=['reference-timer.jpg']
    job('photo-'+name,'Create TWO SEPARATE square souvenir illustrations side by side filling a 2048x1024 image, left square BOY with red baseball cap, right square GIRL with goggles. No borders, text, captions or gutters. Image1 locks children identity, clothing (ochre shirt, red vest/scarf, dark trousers), age and painted style. Each square has ONLY ONE child and the same encounter with corresponding gender; no duplicated children. Both face camera enough to read an excited natural open-mouth smile, playfully disheveled, not frightened or fighting. Camera is a candid trip souvenir, close enough to read face and monster, dynamic dramatic perspective. Paint a COMPLETE new environmental scene, not pasted gameplay sprites. '+scene,refs)
(p/'jobs.json').write_text(json.dumps(jobs,indent=2),encoding='utf8')
print('Prepared',len(jobs),'art briefs.')
