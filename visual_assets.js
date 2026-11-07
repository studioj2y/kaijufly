// Direction 3 visual slice: independently loaded artwork with canvas fallbacks.
(function () {
  'use strict';
  const files = {
    city: 'art_prototypes/production_sample/city.webp',
    stage2: 'art_prototypes/full_assets/stage2.webp',
    stage3: 'art_prototypes/full_assets/stage3.webp',
    stage4: 'art_prototypes/full_assets/stage4.webp',
    moth: 'art_prototypes/revision3/moth-frame-0.webp',
    rodan: 'art_prototypes/revision3/rodan-frame-0.webp',
    balloon: 'art_prototypes/full_assets/balloon.webp',
    plane: 'art_prototypes/revision2/plane-right.webp',
    cloud: 'art_prototypes/revision3/cloud-frame-0.webp',
    gillas: 'art_prototypes/revision3/gillas-frame-0.webp',
    oilrig: 'art_prototypes/full_assets/oilrig.webp',
    chili: 'art_prototypes/full_assets/chili.webp',
    can: 'art_prototypes/full_assets/can.webp',
    birds: 'art_prototypes/full_assets/birds.webp',
    trampoline: 'art_prototypes/full_assets/trampoline.webp',
    building: 'art_prototypes/full_assets/building.webp',
    vent: 'art_prototypes/full_assets/vent.webp',
    bento: 'art_prototypes/full_assets/bento.webp',
    dolly_rail: 'art_prototypes/full_assets/dolly_rail.webp',
    anguirus: 'art_prototypes/full_assets/anguirus.webp',
    canvas: 'art_prototypes/full_assets/canvas.webp',
    sand: 'art_prototypes/full_assets/sand.webp',
    tower: 'art_prototypes/full_assets/tower.webp',
    ultraman: 'art_prototypes/full_assets/ultraman.webp',
    water: 'art_prototypes/full_assets/water.webp',
    dolly: 'art_prototypes/full_assets/dolly.webp',
    chair: 'art_prototypes/full_assets/chair.webp',
    cannon: 'art_prototypes/full_assets/cannon.webp',
    clapper: 'art_prototypes/full_assets/clapper.webp',
    camera: 'art_prototypes/full_assets/camera.webp'
  };
  const images = {};
  ['boy', 'girl', 'moth', 'rodan', 'gillas', 'cloud'].forEach(name => {
    for (let frame = 0; frame < 7; frame++) files[name + 'Frame' + frame] = 'art_prototypes/revision3/' + name + '-frame-' + frame + '.webp';
  });
  if (typeof Image !== 'undefined') {
    Object.keys(files).forEach(name => {
      const image = new Image();
      image.src = files[name];
      images[name] = image;
    });
  }
  window.kaijuArt = {
    character: 'boy',
    setCharacter(character) { this.character = character === 'girl' ? 'girl' : 'boy'; },
    grip(name, time) {
      // Fixed anchors exported by revision3/build.py after talon registration.
      return name === 'moth' ? { x: 0.6009, y: 0.9031 } : { x: 0.3505, y: 0.8456 };
    },
    frame(name, time, offset = 0) {
      if (name === 'pilot') name = this.character;
      return this.get(name + 'Frame' + ((Math.floor(Math.max(0, time) * 7) + offset) % 7)) || this.get(name + 'Frame0');
    },
    get(name) {
      if (['pilot', 'pilotFlap', 'pilotDive'].includes(name)) name = this.character + 'Frame3';
      else if (name.startsWith('pilotFrame')) name = this.character + name.slice(5);
      const image = images[name];
      return image && image.complete && image.naturalWidth > 0 ? image : null;
    }
  };
})();
