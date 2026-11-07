// Direction 3 visual slice: independently loaded artwork with canvas fallbacks.
(function () {
  'use strict';
  const files = {
    city: 'art_prototypes/production_sample/city.webp',
    stage2: 'art_prototypes/full_assets/stage2.webp',
    stage3: 'art_prototypes/full_assets/stage3.webp',
    stage4: 'art_prototypes/full_assets/stage4.webp',
    moth: 'art_prototypes/revision4/moth-frame-0.png',
    rodan: 'art_prototypes/revision4/rodan-frame-0.png',
    gamera: 'art_prototypes/revision4/gamera-frame-0.png',
    plane: 'art_prototypes/revision2/plane-right.webp',
    cloud: 'art_prototypes/revision4/cloud-frame-0.png',
    gillas: 'art_prototypes/revision4/gillas-frame-0.png',
    oilrig: 'art_prototypes/revision4/oilrig-frame-0.png',
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
  const revision = 'art_prototypes/revision5/';
  // Load the opening first, so selecting a visitor never waits for all endings.
  const opening = { 'opening-background': revision + 'opening-background.jpg' };
  ['boy', 'girl'].forEach(name => {
    opening['opening-hero-' + name] = revision + 'opening-hero-' + name + '.png';
  });
  ['moth', 'rodan', 'gamera', 'godzilla', 'gillas', 'ghidorah', 'anguirus'].forEach(name => {
    opening['opening-' + name] = revision + 'opening-' + name + '.png';
  });
  ['gamera', 'cloud', 'oilrig'].forEach(name => files[name] = revision + name + '-frame-0.png');
  const endings = ['canvas', 'anguirus', 'sand', 'tower', 'ultraman', 'water', 'dolly', 'chair'];
  endings.forEach(name => files[name] = revision + 'prop-' + name + '.png');
  const images = {};
  let prioritize = () => {};
  ['boy', 'girl', 'moth', 'rodan', 'gillas', 'cloud', 'gamera', 'oilrig'].forEach(name => {
    for (let frame = 0; frame < 7; frame++) files[name + 'Frame' + frame] = (['gamera', 'cloud', 'oilrig'].includes(name) ? revision : 'art_prototypes/revision4/') + name + '-frame-' + frame + '.png';
  });
  ['day', 'sunset', 'night', 'moon'].forEach(stage => {
    for (let i = 0; i < 3; i++) files['parallax-' + stage + '-' + i] = revision + 'parallax-' + stage + '-' + i + '.png';
  });
  for (let i = 0; i < 3; i++) files['ground-strip-' + i] = revision + 'ground-strip-' + i + '.png';
  endings.forEach(name => ['boy', 'girl'].forEach(gender => {
    for (let i = 0; i < 7; i++) files['ending-' + name + '-' + gender + '-' + i] = revision + 'ending-' + name + '-' + gender + '-' + i + '.png';
  }));
  const current='art_prototypes/revision6/';
  files.cannon=current+'human-cannon.png';
  for(const name of ['gamera','anguirus']) {
    files[name]=current+name+'-frame-0.png';
    for(let i=0;i<7;i++)files[name+'Frame'+i]=current+name+'-frame-'+i+'.png';
  }
  for(let i=0;i<2;i++)opening['title-plate-'+i]=current+'title-plate-'+i+'.png';
  for(const stage of ['day','sunset','night','moon'])for(let i=0;i<3;i++)files['parallax-'+stage+'-'+i]=current+'parallax-'+stage+'-'+i+'.png';
  for(let i=0;i<8;i++)files['decor-'+i]=current+'decor-'+i+'.png';
  for(let i=0;i<3;i++){files['floor-texture-'+i]=current+'floor-texture-'+i+'.png';delete files['ground-strip-'+i];}
  for(const gender of ['boy','girl'])for(let i=0;i<7;i++)files['ending-anguirus-'+gender+'-'+i]=current+'ending-anguirus-'+gender+'-'+i+'.png';
  if (typeof Image !== 'undefined') {
    const byPath = new Map(), queue = [];
    Object.entries({ ...opening, ...files }).forEach(([name, path]) => {
      if (byPath.has(path)) { images[name] = byPath.get(path); return; }
      const image = new Image();
      images[name] = image;
      byPath.set(path, image);
      queue.push({image, path});
    });
    // Share static/first-frame images and bound parallel decoding. A transient
    // read/decode failure gets one fresh request instead of a permanent hole.
    let active = 0, next = 0;
    function pump() {
      while (active < 6 && next < queue.length) {
        const {image, path} = queue[next++];
        active++;
        let retried = false;
        const done = () => { image.onload = image.onerror = null; active--; pump(); };
        image.onload = done;
        image.onerror = () => {
          if (!retried) { retried = true; image.src = path + '?retry=1'; }
          else done();
        };
        image.src = path;
      }
    }
    prioritize = names => {
      const wanted = new Set(names.map(name => images[name]));
      const pending = queue.splice(next);
      queue.push(...pending.filter(item => wanted.has(item.image)), ...pending.filter(item => !wanted.has(item.image)));
      pump();
    };
    pump();
  }
  window.kaijuArt = {
    character: 'boy',
    prioritize(names) { prioritize(names); },
    groundAnchor(name, time) {
      const frames = window.kaijuSceneAssets?.groundAnchors?.[name];
      return frames ? frames[Math.floor(Math.max(0, time) * 7) % 7] : 1;
    },
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
