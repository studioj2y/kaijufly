// Layered film-set scenery and the one-shot collision ending presentation.
(function () {
  'use strict';
  const mod = (n, d) => ((n % d) + d) % d;
  const stages = ['day', 'sunset', 'night', 'moon'];
  function tiled(ctx, image, offset, y, width, height, W) {
    const phase = mod(offset, width);
    for (let x = -phase; x < W; x += width) {
      ctx.drawImage(image, x, y, width + 1, height);
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
      const width = Math.max(W * 1.2, height * image.width / image.height);
      const y = i === 0 ? 0 : H * (i === 1 ? .82 : 1) - height + far * (i === 1 ? .45 : 1);
      tiled(ctx, image, state.camX * ppm * speeds[i] + state.t * drift[i], y, width, height, W);
    });
    ctx.restore();
    return true;
  }
  function tileIndex(index, seed) {
    // Every consecutive group of three uses all three sets, in a seeded order.
    const group = Math.floor(index / 3), slot = mod(index, 3);
    const hash = (Math.imul(group + 91, 1103515245) ^ seed) >>> 0;
    return mod(hash % 3 + slot * (hash & 1 ? 1 : 2), 3);
  }
  function floor(ctx, state, W, H, ppm, groundY) {
    if (groundY > H + 100) return true;
    const art = window.kaijuArt, images = [0, 1, 2].map(i => art && art.get('ground-strip-' + i));
    if (!images.every(Boolean)) return false;
    const tileW = 66 * ppm, overlap = tileW * .07;
    const worldOffset = state.camX * ppm - W * .28;
    const first = Math.floor(worldOffset / tileW) - 1;
    const decorationH = Math.min(130, H * .18);
    const top = groundY - decorationH;
    ctx.save();
    // Floor art extends below the screen and its prop silhouettes rise above
    // the collision baseline. It is decoration, independent of active props.
    for (let index = first; index * tileW - worldOffset < W + tileW; index++) {
      const x = index * tileW - worldOffset;
      const image = images[tileIndex(index, state.seed || 1)];
      const split = Math.round(image.height * .70);
      ctx.drawImage(image, 0, 0, image.width, split, x - overlap, top, tileW + overlap * 2, decorationH);
      ctx.drawImage(image, 0, split, image.width, image.height - split, x - overlap, groundY - 1, tileW + overlap * 2, Math.max(1, H - groundY + 2));
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
    ctx.drawImage(frame, x + (width - dw) / 2, y + (height - dh) / 2, dw, dh);
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
    const ready = openingReady(state), time = state.phase === 'intro' ? state.introT || 0 : 3;
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
      layer(creature, W * (portrait ? .16 : .38), H * .06, W * (portrait ? .90 : .68), H * (portrait ? .52 : .78), W * 1.2 * (1 - ease((time - 1.15) / 1.05)));
      layer(hero, W * (portrait ? -.10 : -.045), H * (portrait ? .26 : .27), W * (portrait ? .78 : .55), H * (portrait ? .38 : .66), -W * 1.15 * (1 - ease((time - .6) / 1.0)));
    }
    ctx.save();
    ctx.fillStyle = '#242b2c';ctx.textAlign = 'left';ctx.font = '900 ' + Math.min(38, W * .052) + 'px Georgia, serif';
    ctx.shadowColor = '#e6d6b8';ctx.shadowBlur = 6;
    ctx.fillText('KAIJU FLY', W * .045, H * .097);
    ctx.font = 'bold ' + Math.min(14, W * .025) + 'px sans-serif';
    ctx.fillText('怪兽飞天 · 特摄片场大冒险', W * .047, H * .13);
    if (time > 2.3) {
      ctx.textAlign = 'right';ctx.font = 'bold ' + Math.min(24, W * .045) + 'px sans-serif';
      ctx.fillText(names[state.openingMonster] + ' · 本日登场', W * .955, H * .095);
    }
    if (!ready && state.phase === 'intro') {
      ctx.textAlign = 'center';ctx.fillStyle = '#f0e4ce';ctx.shadowColor = '#1b2429';ctx.font = 'bold 16px sans-serif';
      ctx.fillText('片场正在布光…', W / 2, H * .75);
    }
    ctx.restore();
  }
  window.kaijuScene = { background, floor, tileIndex, endingIndex, endingReady, drawEnding, endingOverlay, opening, openingReady, monsters };
})();
