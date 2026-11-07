// Layered film-set scenery and the one-shot collision ending presentation.
(function () {
  'use strict';
  const mod = (n, d) => ((n % d) + d) % d;
  const stages = ['day', 'sunset', 'night', 'moon'];
  function hash(index, seed = 1) {
    let v = Math.imul(index ^ seed, 0x45d9f3b);
    v = Math.imul(v ^ (v >>> 16), 0x45d9f3b);
    return (v ^ (v >>> 16)) >>> 0;
  }
  const patchCache = new Map();
  function patch(image, variant) {
    const key = image.src + ':' + variant;
    if (patchCache.has(key)) return patchCache.get(key);
    const random = hash(variant, 331), fraction = .64 + (random % 101) / 400;
    const sw = Math.round(image.width * fraction), sx = (random >>> 9) % Math.max(1, image.width - sw);
    const canvas = document.createElement('canvas'); canvas.width = sw; canvas.height = image.height;
    const c = canvas.getContext('2d');c.drawImage(image,sx,0,sw,image.height,0,0,sw,image.height);
    c.globalCompositeOperation = 'destination-in';
    const feather = c.createLinearGradient(0,0,sw*.13,0);feather.addColorStop(0,'transparent');feather.addColorStop(1,'#fff');
    c.fillStyle=feather;c.fillRect(0,0,sw,canvas.height);
    // Bounded cache, independent of distance travelled through the infinite map.
    if (patchCache.size >= 72) patchCache.delete(patchCache.keys().next().value);
    patchCache.set(key,canvas);return canvas;
  }
  function sceneryBand(ctx, image, offset, bottom, width, height, W, seed, sky) {
    const first = Math.floor(offset / width) - 1;
    for (let index = first; index * width - offset < W; index++) {
      const value = hash(index,seed), variant = value % 16;
      const h = sky ? height : height * (.92 + (value >>> 8) % 17 / 100);
      ctx.drawImage(patch(image,variant),index*width-offset,bottom-h,width*1.18,h);
    }
  }
  function background(ctx, state, W, H, ppm) {
    const art = window.kaijuArt, stage = stages[(state.stage || 1) - 1];
    const layers = [0, 1, 2].map(i => art && art.get('parallax-' + stage + '-' + i));
    if (!layers.every(Boolean)) return false;
    const far = Math.min(H * .12, state.camY * ppm * .025);
    const speeds = [.025, .075, .16], drift = [2, 5, 9];
    ctx.save();
    ctx.fillStyle = ['#8ea5ad', '#885f4b', '#101c2b', '#191d23'][(state.stage || 1) - 1];
    ctx.fillRect(0, 0, W, H);
    layers.forEach((image, i) => {
      const height = i === 0 ? H : H * (i === 1 ? .72 : .75);
      const width = Math.max(W * .9, height * image.width / image.height * .7);
      const y = i === 0 ? 0 : H * (i === 1 ? .82 : 1) - height + far * (i === 1 ? .45 : 1);
      sceneryBand(ctx,image,state.camX*ppm*speeds[i]+state.t*drift[i],y+height,width,height,W,(state.seed||1)+i*41,i===0);
    });
    ctx.restore();
    return true;
  }
  function tileIndex(index, seed) {
    // Independently shuffled groups of eight, with alternating palettes at
    // boundaries. No adjacent duplicates or fixed three-strip rhythm.
    const group = Math.floor(index / 8), slot = mod(index,8);
    const bag = Array.from({length:8},(_,i)=>i);
    for(let i=7;i>0;i--){const j=hash(group*11+i,seed)%(i+1);[bag[i],bag[j]]=[bag[j],bag[i]];}
    const parity=mod(group,2), first=bag.findIndex(v=>v%2===parity);
    [bag[0],bag[first]]=[bag[first],bag[0]];
    // Last has same parity as first; next group's first has the opposite one.
    const last=bag.findIndex((v,i)=>i>0&&v%2===parity);
    [bag[7],bag[last]]=[bag[last],bag[7]];
    return bag[slot];
  }
  function floor(ctx, state, W, H, ppm, groundY) {
    if (groundY > H + 100) return true;
    const art = window.kaijuArt, images = [0, 1, 2].map(i => art && art.get('floor-texture-' + i));
    const decor = Array.from({length:8},(_,i)=>art&&art.get('decor-'+i));
    if (!images.every(Boolean) || !decor.every(Boolean)) return false;
    const tileW = 48 * ppm;
    const worldOffset = state.camX * ppm - W * .28;
    const first = Math.floor(worldOffset / tileW) - 1;
    ctx.save();
    ctx.fillStyle='#625c50';ctx.fillRect(0,groundY,W,Math.max(0,H-groundY));
    // Ground texture and prop clusters scroll independently of one another's
    // repeat length; no mirrored warehouses or recurring three-panel sequence.
    for (let index = first; index * tileW - worldOffset < W + tileW; index++) {
      const x = index * tileW - worldOffset;
      const image = images[hash(index,state.seed||1)%3];
      ctx.drawImage(image,x,groundY-1,tileW*1.16,Math.max(1,H-groundY+2));
    }
    const spacing=19*ppm, start=Math.floor(worldOffset/spacing)-1;
    for(let index=start;index*spacing-worldOffset<W+spacing;index++){
      const value=hash(index,(state.seed||1)+83), im=decor[tileIndex(index,state.seed||1)];
      const h=Math.min(124,H*.17)*(.7+(value%31)/100),w=h*im.width/im.height;
      const x=index*spacing-worldOffset+(value>>>8)%53-26;
      ctx.drawImage(im,x-w*.2,groundY-h+3,w,h);
    }
    if (state.stage > 1) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = state.stage === 2 ? 'rgba(123,55,24,.12)' : state.stage === 3 ? 'rgba(8,18,40,.24)' : 'rgba(28,28,38,.14)';
      ctx.fillRect(0, groundY, W, Math.max(0, H - groundY));
    }
    ctx.restore();
    return true;
  }
  function endingIndex(time) { return Math.min(6, Math.max(0, Math.floor((time - .18) * 7))); }
  function endingReady(state) {
    return Array.from({length: 7}, (_, i) => window.kaijuArt.get('ending-' + state.landingType + '-' + state.character + '-' + i)).every(Boolean);
  }
  function drawEnding(ctx, type, time, character, x, y, width, height) {
    const art = window.kaijuArt, frame = art && (art.get('ending-' + type + '-' + character + '-' + endingIndex(time)) || art.get('ending-' + type + '-' + character + '-0') || art.get(type));
    if (!frame) return false;
    ctx.save();
    ctx.fillStyle = '#e1d7c2';ctx.fillRect(x, y, width, height);
    const city = art.get('city');
    if (city) { ctx.globalAlpha = .17;ctx.drawImage(city, x, y, width, height);ctx.globalAlpha = 1; }
    const scale = Math.min((width - 32) / frame.width, (height - 30) / frame.height);
    const dw = frame.width * scale, dh = frame.height * scale;
    const ride = type === 'anguirus' ? Math.max(0,Math.min(1,(time-1.1)/1.6)) : 0;
    ctx.drawImage(frame, x + (width - dw) / 2 + ride*12, y + (height - dh) / 2 + (ride ? Math.sin(time*7)*1.5 : 0), dw, dh);
    ctx.strokeStyle = '#3b3a32';ctx.lineWidth = 3;ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
    ctx.restore();
    return true;
  }
  function endingOverlay(ctx, state, W, H) {
    const width = Math.min(640, W - 30), height = Math.min(460, H * .66);
    const x = (W - width) / 2, y = (H - height) / 2 + 12;
    ctx.save();ctx.fillStyle = 'rgba(16,24,27,.42)';ctx.fillRect(0, 0, W, H);
    const ready = drawEnding(ctx, state.landingType, state.landingT, state.character || 'boy', x, y, width, height);
    if (ready) {
      ctx.fillStyle = '#f0e6cf';ctx.textAlign = 'center';ctx.font = 'bold ' + (W < 600 ? 17 : 22) + 'px sans-serif';
      ctx.fillText(window.TOKUSATSU_LANDINGS[state.landingType].name, W / 2, y - 15, W - 26);
    }
    ctx.restore();return ready;
  }
  const monsters = ['moth', 'rodan', 'gamera', 'godzilla', 'gillas', 'ghidorah', 'anguirus'];
  const openingTiming = { heroStart: .75, heroDuration: 1.1, monsterStart: 2.15, monsterDuration: 1.15, menuAt: 3.8 };
  const names = { moth: '摩斯拉', rodan: '拉顿', gamera: '加美拉', godzilla: '哥斯拉', gillas: '吉拉斯兄弟', ghidorah: '王者基多拉', anguirus: '安吉拉斯' };
  function openingReady(state) {
    const art = window.kaijuArt;
    return !!(art && art.get('opening-background') && art.get('opening-hero-' + state.character) && art.get('opening-' + state.openingMonster));
  }
  const ease = t => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);
  function opening(ctx, state, W, H) {
    const art = window.kaijuArt, bg = art && art.get('opening-background');
    ctx.fillStyle = '#242e32';ctx.fillRect(0, 0, W, H);
    if (bg) {
      const scale = Math.max(W / bg.width, H / bg.height);
      ctx.drawImage(bg, (W - bg.width * scale) / 2, (H - bg.height * scale) / 2, bg.width * scale, bg.height * scale);
    }
    if (state.phase === 'character') return;
    const ready = openingReady(state), time = state.phase === 'intro' ? state.introT || 0 : openingTiming.menuAt;
    if (ready) {
      const portrait = W / H < 1.1;
      function layer(image, left, top, maxW, maxH, shift) {
        const scale = Math.min(maxW / image.width, maxH / image.height);
        const w = image.width * scale, h = image.height * scale;
        ctx.drawImage(image, left + (maxW - w) / 2 + shift, top + (maxH - h) / 2, w, h);
      }
      const creature = art.get('opening-' + state.openingMonster);
      const hero = art.get('opening-hero-' + state.character);
      // Monsters are behind the foreground child, as in the supplied poster.
      layer(creature, W * (portrait ? .16 : .38), H * .06, W * (portrait ? .90 : .68), H * (portrait ? .52 : .78), W * 1.2 * (1 - ease((time - openingTiming.monsterStart) / openingTiming.monsterDuration)));
      const floatTime=state.openingFloatT||0;
      const bob=-Math.sin(floatTime*1.15)*Math.min(9,H*.012)*Math.min(1,floatTime);
      layer(hero, W * (portrait ? -.10 : -.045), H * (portrait ? .26 : .27) + bob, W * (portrait ? .78 : .55), H * (portrait ? .38 : .66), -W * 1.15 * (1 - ease((time - openingTiming.heroStart) / openingTiming.heroDuration)));
    }
    ctx.save();
    const compact=W<600, panelW=Math.min(460,W*.49), panelH=compact?82:122, panelY=compact?12:16;
    function plaque(side) {
      const x=side?W-panelW-4:4, im=art&&art.get('title-plate-'+side);
      if(im)ctx.drawImage(im,x,panelY,panelW,panelH);
      else{ctx.fillStyle='#f0e5ce';ctx.fillRect(x+panelW*.07,panelY+15,panelW*.86,panelH-30);}
      return x+panelW*(side?.58:.42);
    }
    const left=plaque(0);
    ctx.fillStyle='#20292b';ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=0;
    ctx.font='900 '+Math.min(36,panelW*.105)+'px Georgia, serif';
    ctx.fillText('KAIJU FLY',left,panelY+panelH*.40,panelW*.65);
    ctx.font='bold '+(compact?10:14)+'px sans-serif';
    ctx.fillText(compact?'怪兽飞天 · 片场见学':'怪兽飞天 · 特摄片场大冒险',left,panelY+panelH*.65,panelW*.65);
    if (time > openingTiming.monsterStart + openingTiming.monsterDuration) {
      const right=plaque(1);ctx.fillStyle='#20292b';ctx.font='bold '+(compact?11:14)+'px sans-serif';
      ctx.fillText('本日登场',right,panelY+panelH*.33,panelW*.62);
      ctx.font='bold '+(compact?20:27)+'px sans-serif';
      ctx.fillText(names[state.openingMonster],right,panelY+panelH*.60,panelW*.62);
    }
    if (!ready && state.phase === 'intro') {
      ctx.textAlign = 'center';ctx.fillStyle = '#f0e4ce';ctx.shadowColor = '#1b2429';ctx.font = 'bold 16px sans-serif';
      ctx.fillText('片场正在布光…', W / 2, H * .75);
    }
    ctx.restore();
  }
  window.kaijuScene = { background, floor, tileIndex, endingIndex, endingReady, drawEnding, endingOverlay, opening, openingReady, openingTiming, monsters };
})();
