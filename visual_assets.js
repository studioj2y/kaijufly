// Direction 3 visual slice: independently loaded artwork with canvas fallbacks.
(function () {
  'use strict';
  const files = {
    city: 'art_prototypes/production_sample/city.webp',
    stage2: 'art_prototypes/full_assets/stage2.webp',
    stage3: 'art_prototypes/full_assets/stage3.webp',
    stage4: 'art_prototypes/full_assets/stage4.webp',
    pilot: 'art_prototypes/production_sample/pilot.webp',
    pilotFlap: 'art_prototypes/full_assets/pilot-flap.webp',
    pilotDive: 'art_prototypes/full_assets/pilot-dive.webp',
    moth: 'art_prototypes/production_sample/moth.webp',
    rodan: 'art_prototypes/full_assets/rodan.webp',
    balloon: 'art_prototypes/full_assets/balloon.webp',
    plane: 'art_prototypes/full_assets/plane.webp',
    cloud: 'art_prototypes/full_assets/cloud.webp',
    gillas: 'art_prototypes/full_assets/gillas.webp',
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
  ['pilot', 'moth', 'rodan'].forEach(name => {
    for (let frame = 0; frame < 4; frame++) files[name + 'Frame' + frame] = 'art_prototypes/full_assets/' + name + '-frame-' + frame + '.webp';
  });
  if (typeof Image !== 'undefined') {
    Object.keys(files).forEach(name => {
      const image = new Image();
      image.src = files[name];
      images[name] = image;
    });
  }
  window.kaijuArt = {
    frame(name, time) {
      return this.get(name + 'Frame' + (Math.floor(time * 4) % 4)) || this.get(name === 'pilot' ? 'pilotFlap' : name);
    },
    get(name) {
      const image = images[name];
      return image && image.complete && image.naturalWidth > 0 ? image : null;
    }
  };
})();
