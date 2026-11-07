// ==========================================================================
// KAIJU FLY - 游戏核心物理循环、世界生成与输入系统
// ==========================================================================

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const cv = $('cv'), ctx = cv.getContext('2d');
  let W = 0, H = 0, DPR = 1;

  let PPM = 12.5; // Closer framing; gameplay distances remain in world metres.
  // 核心动力学微调：大幅降低恶性空气阻力衰减，优化俯仰升力与体力消耗
  const G = 13.6, LIFT = 31, VDRAG = 0.50, DRAG = 0.052, DRAIN = 17.5;
  const CHUNK = 160;
  const STAGE_STARTS = [0, 1800, 3750, 6300];
  const progress = window.kaijuProgress;
  const level = id => (S.loadout && S.loadout[id]) || 0;
  const maxEnergy = () => 65 + level('stamina') * 15;

  // 空中特摄道具池 (包含拉顿、摩斯拉、基拉斯旋转等)
  const AIR_TYPES = [
    'cloud', 'rodan', 'mothra', 'balloon', 'plane',
    'gillas', 'oilrig', 'chili', 'can', 'birds'
  ];

  // 地面特摄见学收尾道具池 (8种爆笑见学纪念结局)
  const GROUND_LANDING_TYPES = [
    'anguirus', 'canvas', 'sand', 'tower', 'ultraman', 'water', 'dolly', 'chair'
  ];

  // 地面交互设施池 (弹力蹦床、纸板大厦跳板、原子喷口、便当补给长桌、滑轨冲刺车)
  const GROUND_FACILITY_TYPES = [
    'trampoline', 'building', 'vent', 'bento', 'dolly_rail'
  ];

  const STUNT_LABEL = {
    cloud: '特斯拉静电充能',
    rodan: '拉顿超音速破空',
    mothra: '摩斯拉神圣鳞粉',
    balloon: '哥斯拉肚腩弹跳',
    plane: '特搜战机喷射加速',
    gillas: '基拉斯合体大旋转',
    oilrig: '蓝色原子吐息爆发',
    chili: '骑士推进糖果',
    can: '特摄能量果汁',
    birds: '小巴尔坦道具连击',
    // 地面交互设施专属标签
    trampoline: '特摄橡胶肚腩大弹跳',
    building: '纸板大楼爆碎冲刺',
    vent: '原子地井蒸汽冲天',
    bento: '剧组便当满血复活',
    dolly_rail: '摄影滑轨极速暴冲',
    skid: '特摄滑铲借力受身'
  };

  const STUNT_MUG = {
    cloud: '静电炸毛！爽快！',
    rodan: '飞得比喷气机还快！',
    mothra: '治愈鳞粉！体力充满！',
    balloon: '巨兽肚皮太有弹性啦！',
    plane: '战机尾流带我冲！',
    gillas: '头晕目眩！赛文同款旋转！',
    oilrig: '原子光线直冲云霄！',
    chili: '屁股喷出彩色火焰！',
    can: '喝一口满血复活！',
    birds: '好多迷你小宇宙人！',
    trampoline: 'DUANG~弹到云彩上面啦！',
    building: '大厦爆碎！特摄烟火太炫了！',
    vent: '好烫好爽！强劲热风托起！',
    bento: '剧组豪华便当！大满足！',
    dolly_rail: '顺着轨道飞速狂飙！',
    skid: '双脚擦出火花！借力再弹！'
  };

  // 通告只要求飞得更远；场景与互动始终随机生成。
  const TOKUSATSU_MISSIONS = [
    {
      target: 2000, desc: '飞过 2000 米，完成首次远征',
      head: '飞越摄影棚！首次远征登上片场特报！',
      sub: '从摄影棚一路飞到暮色布景，小见学者交出了第一份长途飞行纪录'
    },
    {
      target: 3500, desc: '飞过 3500 米，穿越微缩都市',
      head: '穿越微缩都市！摄影机差点追不上！',
      sub: '无论遇见哪位怪兽，飞行距离才是这场挑战的主角'
    },
    {
      target: 5000, desc: '飞过 5000 米，挑战月面片场',
      head: '冲破七千五百米！月面片场留下飞行轨迹！',
      sub: '一次次选择扑腾和俯冲，终于把旅程延伸到了最终幕'
    },
    {
      target: 7000, desc: '飞过 7000 米，刷新片场纪录',
      head: '一万零五百米新纪录！片场全员仰望天空！',
      sub: '随机出现的布景与道具，让这次纪录有了独一无二的故事'
    },
    {
      target: 10000, desc: '飞过 10000 米，完成万米远征',
      head: '一万五千米远征达成！传奇镜头写进片场史！',
      sub: '穿过四幕布景之后，仍然愿意再飞一次的勇气才是终极特技'
    }
  ];

  // 全局游戏状态
  TOKUSATSU_MISSIONS.forEach(m => {
    const previous = m.target;
    m.target = Math.round(previous * 1.5);
    m.desc = m.desc.replace(String(previous), String(m.target));
  });
  const S = {
    phase: 'menu', mode: 'distance', t: 0, frame: 0, angle: 45, power: 60, aimT: 0, powerT: 0,
    j: { x: 0, y: 0, vx: 0, vy: 0, energy: 100, arm: 0 },
    holding: false, dist: 0, bonus: 0, combo: 0, comboTimer: 0, events: {}, stage: 1, skids: 0,
    air: [], ground: [], genX: 0, camX: 0, camY: 0, shake: 0, flash: 0, skeleton: 0, stun: 0, spin: 0,
    carried: 0, carryType: null,
    particles: [], landingType: 'sand', landingT: 0, landingObj: null, mission: null, missionIdx: 0, missionOk: false,
    muted: false, best: { dist: 0, score: 0 }, frozen: false, testMode: false, shotMode: null, seed: 1
  };

  // ---------------- 工具函数 ----------------
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function tri(t) { const p = ((t % 2) + 2) % 2; return p < 1 ? p : 2 - p; }
  function rnd32(seed) {
    let a = seed >>> 0;
    return function () {
      a += 0x6D2B79F5;
      let t = a;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    PPM = W < 600 ? 8.5 : 12.5;
    cv.width = Math.round(W * DPR);
    cv.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function wx(x) { return (x - S.camX) * PPM + W * 0.28; }
  function gy() { return H * 0.80; }
  function wy(y) { return gy() - (y - S.camY) * PPM; }

  function saveBest() {
    if (S.testMode) return;
    try { localStorage.setItem('kaijufly_best', JSON.stringify(S.best)); } catch (e) {}
  }
  function loadBest() {
    try {
      const o = JSON.parse(localStorage.getItem('kaijufly_best') || '{}');
      S.best.dist = +o.dist || 0;
      S.best.score = +o.score || 0;
    } catch (e) {}
  }

  // ---------------- 实体尺寸与高度生成 ----------------
  function entitySize(t) {
    switch (t) {
      case 'cloud': return [22, 10];
      case 'rodan': return [16, 7];
      case 'mothra': return [16, 8];
      case 'balloon': return [12, 13];
      case 'plane': return [14, 6];
      case 'gillas': return [14, 32];
      case 'oilrig': return [9, 16];
      case 'chili': return [4, 4];
      case 'can': return [4, 4];
      case 'birds': return [10, 5];
      default: return [7, 7];
    }
  }

  function airHeight(t, r) {
    switch (t) {
      case 'cloud': return 52 + r() * 38;
      case 'rodan': return 26 + r() * 48;
      case 'mothra': return 30 + r() * 45;
      case 'balloon': return 16 + r() * 38;
      case 'plane': return 28 + r() * 48;
      case 'gillas': return 15 + r() * 4;
      case 'oilrig': return 7 + r() * 4;
      case 'chili': return 12 + r() * 58;
      case 'can': return 12 + r() * 58;
      case 'birds': return 30 + r() * 45;
      default: return 30;
    }
  }

  function makeEnt(t, x, y, r) {
    const s = entitySize(t);
    return { type: t, x: x, y: y, w: s[0], h: s[1], hit: false, ph: (r ? r() : Math.random()) * 6.28 };
  }

  function groundSize(t) {
    switch (t) {
      case 'tower': return 16;
      case 'canvas': return 14;
      case 'anguirus': return 10;
      case 'ultraman': return 10;
      case 'water': return 14;
      case 'dolly': return 10;
      case 'chair': return 8;
      case 'sand': return 12;
      // 地面交互设施尺寸
      case 'trampoline': return 15;
      case 'building': return 14;
      case 'vent': return 12;
      case 'bento': return 11;
      case 'dolly_rail': return 16;
      default: return 10;
    }
  }

  function makeGround(t, x, isFacility = false) {
    return { type: t, x: x, w: groundSize(t), hit: false, isFacility: isFacility };
  }

  function genChunk(start) {
    const r = rnd32(S.seed + Math.floor(start / CHUNK) * 7919 + 13);
    const dist = start / 1.5;

    // 稀疏但持续的互动；飞得更远不应自动获得更密集的续命道具。
    let airN = 1 + Math.floor(r() * 2);
    let facN = r() < 0.4 ? 1 : 0;

    if (dist >= 800 && dist < 2200) {
      airN = 2 + Math.floor(r() * 2);
      facN = r() < 0.55 ? 1 : 0;
    } else if (dist >= 2200 && dist < 4200) {
      airN = 2 + Math.floor(r() * 2);
      facN = r() < 0.5 ? 1 : 0;
    } else if (dist >= 4200) {
      airN = 1 + Math.floor(r() * 2);
      facN = r() < 0.35 ? 1 : 0;
    }

    const extra = airN * level('density') * 0.2;
    airN += Math.floor(extra) + (r() < extra % 1 ? 1 : 0);
    // 生成空中道具
    for (let i = 0; i < airN; i++) {
      let t;
      if (dist >= 1200 && r() < 0.18) {
        const highTypes = ['rodan', 'mothra', 'gillas', 'plane', 'balloon', 'chili'];
        t = highTypes[Math.floor(r() * highTypes.length)];
      } else {
        t = AIR_TYPES[Math.floor(r() * AIR_TYPES.length)];
      }
      S.air.push(makeEnt(t, start + 12 + r() * (CHUNK - 24), airHeight(t, r), r));
    }

    // 生成地面交互设施 (弹力蹦床、纸板大楼、原子喷口、剧组便当、滑轨车)
    for (let i = 0; i < facN; i++) {
      const ft = GROUND_FACILITY_TYPES[Math.floor(r() * GROUND_FACILITY_TYPES.length)];
      const fx = start + 14 + (i / facN) * (CHUNK - 28) + (r() - 0.5) * 10;
      S.ground.push(makeGround(ft, fx, true));
    }

    // 规律生成见学收场道具 (安吉拉斯、背景画板、东京铁塔等)
    const endN = 1 + Math.floor(r() * 2);
    for (let i = 0; i < endN; i++) {
      const lt = GROUND_LANDING_TYPES[Math.floor(r() * GROUND_LANDING_TYPES.length)];
      S.ground.push(makeGround(lt, start + 25 + r() * (CHUNK - 50), false));
    }
  }

  function buildWorld() {
    S.air = []; S.ground = []; S.genX = 0;
    S.seed = Math.floor(Math.random() * 1e6) + 1;
    for (let i = 0; i < 7; i++) {
      genChunk(S.genX);
      S.genX += CHUNK;
    }
  }

  function ensureWorld() {
    let generated = false;
    while (S.genX < S.camX + W / PPM + CHUNK * 3) {
      genChunk(S.genX);
      S.genX += CHUNK;
      generated = true;
    }
    if (generated) {
      // 保留一块屏外缓冲；早已飞过的机关无需继续参与碰撞与绘制。
      const oldestVisibleX = S.camX - W * 0.28 / PPM - CHUNK;
      S.air = S.air.filter(e => e.x + e.w / 2 >= oldestVisibleX);
      S.ground = S.ground.filter(g => g.x + g.w / 2 >= oldestVisibleX);
    }
  }

  // ---------------- 粒子与弹幕提示 ----------------
  function puff(x, y, n, color, spd) {
    const inkColors = { '#ffffff': '#e9dfc8', '#ffd43b': '#d1b276', '#fcc419': '#d1b276', '#ff6b6b': '#b96346', '#e8590c': '#b96346', '#69db7c': '#839281', '#339af0': '#75a6b5', '#74c0fc': '#75a6b5', '#22b8cf': '#75a6b5', '#4dabf7': '#75a6b5' };
    color = inkColors[color] || '#b4a38a';
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, v = spd || 8;
      S.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * v * (0.4 + Math.random()),
        vy: Math.sin(a) * v * (0.4 + Math.random()) + 3,
        life: 0.5 + Math.random() * 0.7,
        max: 1.2,
        color: color || '#fff',
        size: 1 + Math.random() * 3
      });
    }
  }

  let toastTimer = 0, mugTimer = 0;
  function toast(msg) {
    const e = $('toast');
    e.textContent = msg;
    e.classList.add('on');
    toastTimer = 1.6;
  }

  function mug(face, text) {
    $('mugFace').textContent = face;
    $('mugText').textContent = text;
    $('mug').classList.remove('hidden');
    mugTimer = 2.4;
  }

  // ---------------- 游戏流程管理 ----------------
  function showMenu() {
    $('workshop').classList.add('hidden');
    S.phase = 'menu'; S.holding = false; S.frozen = false;
    $('menu').classList.remove('hidden');
    $('result').classList.add('hidden');
    $('paper').classList.add('hidden');
    $('hud').classList.add('hidden');
    $('mug').classList.add('hidden');
    $('bigText').classList.remove('on');
    S.dist = 0; S.bonus = 0; S.combo = 0; S.events = {};
    S.j.x = 0; S.j.y = 0; S.camX = 0; S.camY = 0;
  }

  function startGame(mode, missionIdx) {
    S.loadout = progress ? progress.snapshot() : {};
    S.rewarded = false;
    $('workshop').classList.add('hidden');
    S.mode = mode;
    S.missionIdx = missionIdx || 0;
    S.mission = mode === 'career' ? TOKUSATSU_MISSIONS[S.missionIdx % TOKUSATSU_MISSIONS.length] : null;
    S.phase = 'aim';
    S.aimT = 0; S.powerT = 0; S.t = 0;
    S.j = { x: 0, y: 0, vx: 0, vy: 0, energy: maxEnergy(), arm: 0 };
    S.holding = false; S.dist = 0; S.bonus = 0; S.combo = 0; S.comboTimer = 0; S.events = {}; S.stage = 1; S.skids = 0;
    S.camX = 0; S.camY = 0; S.shake = 0; S.flash = 0; S.skeleton = 0; S.stun = 0; S.spin = 0;
    S.carried = 0; S.carryType = null;
    S.particles = []; S.landingType = 'sand'; S.landingT = 0; S.landingObj = null; S.missionOk = false; S.frozen = false;

    buildWorld();

    $('menu').classList.add('hidden');
    $('result').classList.add('hidden');
    $('paper').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('mug').classList.add('hidden');
    $('bigText').classList.remove('on');

    const mb = $('missionBox');
    if (S.mission) {
      mb.textContent = '🎬 拍摄通告 ' + (S.missionIdx + 1) + '：' + S.mission.desc;
      mb.classList.remove('hidden');
    } else {
      mb.classList.add('hidden');
    }
    updateHUD();
  }

  function launch() {
    const a = S.angle * Math.PI / 180, v0 = 42 + S.power * 0.58;
    S.j.vx = v0 * Math.cos(a);
    S.j.vy = v0 * Math.sin(a);
    S.j.x = 0; S.j.y = 2; S.j.energy = maxEnergy();
    S.phase = 'flying'; S.holding = false; S.shake = 10; S.flash = 0.25;

    puff(0, 3, 28, '#ffd43b', 16);
    window.kaijuAudio.play('launch');
    toast('🚀 出炮升空！按住长按挥舞双臂！');
    $('tip').textContent = '按住 空格 / 鼠标 / 屏幕 挥动手臂爬升，松开滑翔';
  }

  function addStunt(k, pts) {
    S.events[k] = (S.events[k] || 0) + 1;
    S.combo++; S.comboTimer = 3.2;
    const awardedScore = Math.round(pts * S.combo * (1 + level('combo') * 0.15));
    S.bonus += awardedScore;
    toast(STUNT_LABEL[k] + ' +' + awardedScore);
    mug('^o^', STUNT_MUG[k] || '特技镜头太帅啦！');
    updateHUD();
  }

  function hit(e) {
    if (e.hit) return;
    e.hit = true;
    const j = S.j, type = e.type;

    switch (type) {
      case 'cloud':
        // 特斯拉人工电离云：全身触电火花 + 瞬间充能 + 骨骼透视
        j.energy = Math.min(maxEnergy(), j.energy + 50);
        j.vy += 22; j.vx *= 0.9;
        S.stun = 0.35; S.skeleton = 1.15; S.flash = 0.65; S.shake = 12;
        puff(e.x, e.y, 34, '#74c0fc', 20);
        window.kaijuAudio.play('spark');
        addStunt('cloud', 140);
        break;

      case 'rodan':
        // 拉顿！超音速破空向前极速狂飙！
        S.carried = 2.2; S.carryType = 'rodan'; S.carryY = Math.max(j.y, e.y);
        j.vx = 86; j.vy = 0; S.shake = 6;
        puff(e.x, e.y, 24, '#e8590c', 16);
        window.kaijuAudio.play('rodan');
        addStunt('rodan', 160);
        break;

      case 'mothra':
        // 摩斯拉！神圣风铃与金粉治愈！向上温柔翱翔 + 体力狂涨满血！
        S.carried = 2.6; S.carryType = 'mothra'; S.carryY = Math.max(j.y, e.y) + 8;
        j.vx = 52; j.vy = 12;
        j.energy = Math.min(maxEnergy(), j.energy + 20 + level('moth') * 15);
        puff(e.x, e.y, 30, '#ffd43b', 12);
        window.kaijuAudio.play('mothra');
        addStunt('mothra', 180);
        break;

      case 'balloon':
        // 哥斯拉软胶大肚腩！DUANG 地高高弹起！
        j.vy = 33; j.vx *= 1.08; S.shake = 6;
        puff(e.x, e.y, 20, '#69db7c', 14);
        window.kaijuAudio.play('boing');
        addStunt('balloon', 110);
        break;

      case 'plane':
        // 特搜战机掠过推力冲刺！
        j.vx += 25; j.vy += 7; S.spin = 0.5; S.shake = 7;
        puff(e.x, e.y, 22, '#ff6b6b', 18);
        window.kaijuAudio.play('hit');
        addStunt('plane', 120);
        break;

      case 'gillas':
        // 雷欧名场面：基拉斯兄弟旋转！被飓风卷上天旋转！
        j.vy = 38; j.vx *= 0.85; S.spin = 1.6; S.shake = 10;
        puff(e.x, e.y, 32, '#ffa94d', 18);
        window.kaijuAudio.play('gillas');
        addStunt('gillas', 170);
        break;

      case 'oilrig':
        // 哥斯拉蓝色原子吐息爆发喷涌！
        j.vy = 32; j.vx += 10; S.shake = 8;
        puff(e.x, e.y, 26, '#339af0', 20);
        window.kaijuAudio.play('beam');
        addStunt('oilrig', 140);
        break;

      case 'chili':
        // 假面骑士推进糖果！身后喷彩烟加速
        j.energy = Math.min(maxEnergy(), j.energy + 28);
        j.vx += 18; S.flash = 0.15;
        puff(e.x, e.y, 16, '#ff6b6b', 12);
        window.kaijuAudio.play('pickup');
        addStunt('chili', 80);
        break;

      case 'can':
        // M87 剧组能量便当/果汁补充
        j.energy = Math.min(maxEnergy(), j.energy + 45);
        puff(e.x, e.y, 16, '#22b8cf', 10);
        window.kaijuAudio.play('pickup');
        addStunt('can', 70);
        break;

      case 'birds':
        // 撞碎飞天小巴尔坦星人模型群
        j.vx += 4; S.shake = 3;
        puff(e.x, e.y, 16, '#ffffff', 11);
        window.kaijuAudio.play('hit');
        addStunt('birds', 60);
        break;
    }
    updateHUD();
  }

  function checkCollisions() {
    const j = S.j;
    for (let i = 0; i < S.air.length; i++) {
      const e = S.air[i];
      if (e.hit || e.x < j.x - 60 || e.x > j.x + 60) continue;
      if (Math.abs(e.x - j.x) < e.w / 2 + 2.0 && Math.abs(e.y - j.y) < e.h / 2 + 2.0) {
        hit(e);
      }
    }
  }

  function triggerGroundFacility(g) {
    const j = S.j;
    switch (g.type) {
      case 'trampoline':
        // 哥斯拉橡胶肚皮大弹簧床！DUANG 地高高弹起！
        j.vy = Math.max(36, Math.abs(j.vy) * 0.8 + 26);
        j.vx = Math.max(j.vx * 1.05 + 8, 38);
        S.shake = 8;
        puff(g.x, 2, 28, '#69db7c', 16);
        puff(g.x, 2, 14, '#ffd43b', 12);
        window.kaijuAudio.play('boing');
        addStunt('trampoline', 120);
        break;

      case 'building':
        // 昭和纸板大楼爆碎！泡沫碎块飞溅，顺势弹射！
        j.vy = Math.max(32, Math.abs(j.vy) * 0.7 + 22);
        j.vx = Math.max(j.vx * 1.08 + 10, 42);
        S.shake = 10;
        puff(g.x, 5, 36, '#ced4da', 18);
        puff(g.x, 5, 20, '#ffd43b', 15);
        window.kaijuAudio.play('hit');
        window.kaijuAudio.play('launch');
        addStunt('building', 140);
        break;

      case 'vent':
        // 原子热线烟雾地井喷口！强劲气流直冲云霄！
        j.vy = 44;
        j.vx = Math.max(j.vx + 6, 32);
        S.shake = 7;
        puff(g.x, 3, 30, '#4dabf7', 22);
        puff(g.x, 3, 16, '#ffffff', 16);
        window.kaijuAudio.play('beam');
        addStunt('vent', 130);
        break;

      case 'bento':
        // 剧组高级便当与能量果汁长桌！体力大回复 + 小幅弹跳！
        j.energy = Math.min(maxEnergy(), j.energy + 45);
        j.vy = Math.max(j.vy, 18);
        j.vx = Math.max(j.vx + 12, 34);
        puff(g.x, 2, 22, '#ffd43b', 10);
        puff(g.x, 2, 16, '#22b8cf', 12);
        window.kaijuAudio.play('pickup');
        addStunt('bento', 90);
        break;

      case 'dolly_rail':
        // 摄影轨道车极速冲刺带！
        j.vx = Math.max(j.vx + 26, 52);
        j.vy = Math.max(j.vy, 10);
        S.shake = 6;
        puff(g.x, 1, 24, '#fcc419', 16);
        window.kaijuAudio.play('skid');
        addStunt('dolly_rail', 110);
        break;
    }
  }

  function checkGroundFacilities() {
    const j = S.j;
    if (j.y > 9.5) return false;
    for (let i = 0; i < S.ground.length; i++) {
      const g = S.ground[i];
      if (!g.isFacility || g.hit || g.x < j.x - 30 || g.x > j.x + 30) continue;
      if (Math.abs(g.x - j.x) < g.w / 2 + 2.0 && j.y <= 8.5) {
        g.hit = true;
        triggerGroundFacility(g);
        return true;
      }
    }
    return false;
  }

  function checkStageTransition() {
    const x = S.j.x;
    let newStage = 1;
    if (x >= STAGE_STARTS[3]) newStage = 4;
    else if (x >= STAGE_STARTS[2]) newStage = 3;
    else if (x >= STAGE_STARTS[1]) newStage = 2;

    if (newStage !== S.stage) {
      S.stage = newStage;
      window.kaijuAudio.play('stage');
      S.flash = 0.45;
      S.shake = 8;
      if (newStage === 2) {
        toast('🎬 第2幕：夕陽の怪獣大決戦セット！');
        mug('★_★', '夕阳西下！怪兽大激斗开拍！');
      } else if (newStage === 3) {
        toast('🎬 第3幕：深夜の東京ミニチュア都市！');
        mug('★_★', '聚光灯亮起！东京铁塔霓虹夜景！');
      } else if (newStage === 4) {
        toast('🎬 最终幕：宇宙月面特撮セット！');
        mug('^o^', '飞出大气层！漂浮在月球微缩基地！');
      }
      updateHUD();
    }
  }

  function findGround(x) {
    let best = null, bd = 1e9;
    for (let i = 0; i < S.ground.length; i++) {
      const g = S.ground[i];
      if (g.isFacility) continue; // 仅寻找见学收场道具
      const d = Math.abs(g.x - x);
      if (d < g.w / 2 + 5.5 && d < bd) {
        bd = d; best = g;
      }
    }
    return best;
  }

  function checkMission() {
    return !!S.mission && S.dist >= S.mission.target;
  }

  function doLanding(forceType) {
    if (S.phase !== 'flying') return;
    const g = forceType ? { type: forceType, x: S.j.x, w: 8 } : findGround(S.j.x);
    S.landingType = g ? g.type : 'sand';
    S.landingObj = g;
    S.phase = 'landing';
    S.landingT = 0; S.holding = false; S.shake = 15; S.flash = 0.35;

    if (S.landingType === 'dolly') S.dist += 15; // 轨道车顺势滑行加分
    S.missionOk = checkMission();

    const L = window.TOKUSATSU_LANDINGS[S.landingType] || window.TOKUSATSU_LANDINGS['sand'];
    $('bigText').textContent = L.head;
    $('bigText').classList.add('on');
    mug(L.face, L.name);

    if (S.landingType === 'anguirus' || S.landingType === 'canvas') {
      window.kaijuAudio.play('tear');
    } else {
      window.kaijuAudio.play('crash');
    }
    puff(S.j.x, 0, 32, '#d8c49d', 14);
    updateHUD();
  }

  function showResult() {
    S.phase = 'result'; S.frozen = false;
    const dist = Math.round(S.dist);
    const L = window.TOKUSATSU_LANDINGS[S.landingType] || window.TOKUSATSU_LANDINGS['sand'];
    const score = dist + S.bonus + L.bonus;
    if (!S.rewarded && progress && !S.testMode) {
      const count = Object.values(S.events).reduce((a, b) => a + b, 0);
      const reward = progress.award(dist, count, S.missionOk);
      S.rewarded = true;
      const message = '本次获得 ' + reward.points + ' 片场点数 · 可用 ' + progress.data.points + (reward.saved ? '' : '（浏览器未能保存，请勿关闭页面）');
      $('runReward').textContent = message;
      $('paperReward').textContent = message;
    }

    if (dist > S.best.dist) S.best.dist = dist;
    if (score > S.best.score) S.best.score = score;
    saveBest();

    $('bigText').classList.remove('on');

    if (S.mode === 'career' && S.missionOk) {
      window.kaijuAudio.play('win');
      showPaper(dist, score);
      return;
    }

    const ok = S.mode === 'distance';
    $('resTitle').textContent = ok ? '本 次 见 学 收 场' : '通 告 留 待 改 进';
    $('resDist').textContent = dist;
    $('resScore').textContent = score;
    $('resBest').textContent = S.best.dist;
    $('resBestScore').textContent = S.best.score;
    $('resNote').textContent = ok
      ? '收场方式：' + L.name + ' · ' + L.note + ' · 途中完成 ' + Object.values(S.events).reduce((a, b) => a + b, 0) + ' 次特摄互动！'
      : '本次飞到 ' + dist + ' 米，距离 ' + S.mission.target + ' 米目标还差 ' + Math.max(0, S.mission.target - dist) + ' 米。再拍一发！';

    $('nextMission').classList.add('hidden');
    $('result').classList.remove('hidden');
    if (!ok) window.kaijuAudio.play('fail');
  }

  function showPaper(dist, score) {
    const m = S.mission;
    const L = window.TOKUSATSU_LANDINGS[S.landingType] || window.TOKUSATSU_LANDINGS['sand'];
    $('paperDate').textContent = new Date().toLocaleDateString('zh-CN');
    $('paperHead').textContent = m.head;
    $('paperSub').textContent = m.sub;
    $('paperText').innerHTML =
      '<p class="drop">特摄片场特报记者实况报道：今日前来参观的小勇士乘着剧组的实验飞天大炮破空而起，' +
      '在空中横贯 ' + dist + ' 米摄影棚微缩实景，完成了本期导演指定的里程挑战，最终以「' + L.name + '」的爆笑姿态圆满收场，获得全剧组人员 ' + score + ' 分的欢呼喝采！</p>' +
      '<p>摄影指导表示，该名小朋友在飞行途中熟练触发了 ' +
      Object.keys(S.events).map(k => STUNT_LABEL[k] || k).join('、') +
      ' 等高难度特摄动作，全程单手操作，表情十分精彩！</p>' +
      '<p>总监督已连夜签发下一部拍摄通告，道具组正忙着修补被撞破的布景大楼与短裤。</p>' +
      '<span class="stamp">特 报 已 存 档 🏆</span>';

    $('paper').classList.remove('hidden');

    const pc = $('paperPic').getContext('2d');
    window.drawTokusatsuLandingVignette(pc, S.landingType, 250, 270, 1.0, 0.6, 500, 360);
  }

  function updateHUD() {
    const e = $('energyFill');
    e.style.width = clamp(S.j.energy / maxEnergy() * 100, 0, 100) + '%';
    e.classList.toggle('low', S.j.energy < 28);
    $('distVal').textContent = Math.round(S.dist);
    $('comboVal').textContent = S.combo;
    $('bestVal').textContent = S.best.dist;

    const sb = $('stageBadge');
    if (sb) {
      const stageNames = {
        1: '🎬 第1幕：白昼摄影棚',
        2: '🎬 第2幕：夕陽の怪獣決戦',
        3: '🎬 第3幕：深夜の東京ミニチュア',
        4: '🎬 最终幕：宇宙月面特撮'
      };
      sb.textContent = stageNames[S.stage || 1] || '🎬 特摄片场';
    }

    if (S.phase === 'aim') {
      $('tip').textContent = '① 按一下锁定大炮发射仰角：' + S.angle.toFixed(0) + '°';
    } else if (S.phase === 'power') {
      $('tip').textContent = '② 再按一下锁定火药装填力度：' + S.power.toFixed(0) + '%';
    }
  }

  // ---------------- 物理模拟核心 (60 FPS 步进) ----------------
  function step(dt) {
    S.t += dt; S.frame++;

    // 粒子模拟
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const p = S.particles[i];
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy -= 16 * dt;
      if (p.life <= 0) S.particles.splice(i, 1);
    }

    if (toastTimer > 0) { toastTimer -= dt; if (toastTimer <= 0) $('toast').classList.remove('on'); }
    if (mugTimer > 0) { mugTimer -= dt; if (mugTimer <= 0) $('mug').classList.add('hidden'); }
    if (S.shake > 0) S.shake = Math.max(0, S.shake - dt * 26);
    if (S.flash > 0) S.flash = Math.max(0, S.flash - dt * 1.8);
    if (S.skeleton > 0) S.skeleton = Math.max(0, S.skeleton - dt);
    if (S.stun > 0) S.stun = Math.max(0, S.stun - dt);
    if (S.spin > 0) S.spin = Math.max(0, S.spin - dt);
    if (S.comboTimer > 0) { S.comboTimer -= dt; if (S.comboTimer <= 0) S.combo = 0; }

    switch (S.phase) {
      case 'aim':
        S.aimT += dt; S.angle = 12 + 66 * tri(S.aimT * 0.85); updateHUD(); break;
      case 'power':
        S.powerT += dt; S.power = 8 + 92 * tri(S.powerT * 1.1); updateHUD(); break;
      case 'flying':
        updateFlight(dt); break;
      case 'landing':
        S.landingT += dt;
        if (S.landingT > 2.9) showResult();
        break;
    }
  }

  let flapSfxT = 0;
  function updateFlight(dt) {
    const j = S.j;

    // 拉顿高速顺风车 或 摩斯拉神圣鳞粉带飞
    if (S.carried > 0) {
      S.carried -= dt;
      if (S.carryType === 'rodan') {
        // 拉顿：极速向前俯冲，强力破空冲刺！
        j.x += 84 * dt;
        j.y = S.carryY + Math.sin(S.t * 8) * 0.5;
        j.vx = 84; j.vy = 0;
        // Carrying preserves energy but is not an unlimited recharge.
        j.arm += dt * 6;
      } else if (S.carryType === 'mothra') {
        // 摩斯拉：温柔向上翱翔，神圣鳞粉使体力急速回满！
        j.x += 54 * dt;
        j.y = S.carryY + Math.sin(S.t * 5) * 1.2;
        j.vx = 54; j.vy = 6;
        // Mothra's finite heal is applied once, when contact begins.
        j.arm += dt * 4;
        // 洒落金粉粒子
        if (Math.random() < dt * 25) {
          puff(j.x - 1, j.y - 1, 1, '#ffd43b', 4);
        }
      }

      if (S.carried <= 0) {
        j.vy = S.carryType === 'rodan' && level('toss') ? 7 + level('toss') * 7 : 4;
        j.vx *= 0.94;
        toast(S.carryType === 'rodan' ? (level('toss') ? '拉顿斜上方抛出！' : '拉顿松爪！顺风滑翔！') : '摩斯拉松爪！鳞粉补给完成！');
      }
    } else {
      // 当前阶段重力：太空月面基地阶段 (4200m+) 具有略微低重力，带来轻盈的漂浮感
      const curG = S.j.x >= STAGE_STARTS[3] ? 9.6 : G;

      // 玩家长按：双手扑腾扑腾爬升！
      const flap = S.holding && j.energy > 0 && S.stun <= 0;
      // 体力归零时仍能微调姿态，但无法持续凭空爬升或加速。
      const emergency = S.holding && j.energy <= 0 && S.stun <= 0;

      let ay = -curG + (flap ? LIFT : (emergency ? 2.5 : 0)) + Math.min(8, j.vx * 0.08);
      ay -= j.vy * VDRAG;
      j.vy += ay * dt;

      if (flap) {
        j.energy = Math.max(0, j.energy - DRAIN * (1 - level('efficiency') * 0.08) * dt);
        // ★ 核心手感优化：扑腾不仅抬升，更产生前向推力！挣扎能真正改变结果！
        j.vx += 8.5 * dt;
        j.arm += dt * 15;
        flapSfxT -= dt;
        if (flapSfxT <= 0) {
          window.kaijuAudio.play('flap');
          flapSfxT = 0.19;
        }
        if (Math.random() < dt * 22) puff(j.x - 1, j.y - 0.6, 1, '#ffffff', 5);
      } else if (emergency) {
        j.vx += 0.5 * dt; // 微弱姿态修正，不构成无限续航
        j.arm += dt * 10;
        if (Math.random() < dt * 14) puff(j.x - 1, j.y - 0.4, 1, '#ffc9c9', 3);
      } else {
        // 未按住时：俯冲气动滑翔，势能转化为前向动能 (Aerodynamic Swoop)
        if (j.vy < -2.5) {
          j.vx += Math.min(22, -j.vy * 0.28) * dt;
        }
        j.arm += dt * 3;
      }

      // 攻角与气流阻尼：平滑过渡，取消恶性失速骤降
      const ang = Math.atan2(j.vy, Math.max(1, j.vx));
      if (ang > 1.2) {
        j.vx -= j.vx * 0.16 * dt; // 大攻角平缓气流阻尼，绝不再秒扣 95%！
      }

      // 动态空气阻力：高速标准阻力，低速/巡航阻力减免，避免空中便秘停滞
      const curDrag = j.vx < 28 ? Math.max(0.018, DRAG * (j.vx / 28)) : DRAG;
      j.vx -= j.vx * curDrag * dt;

      // 保留真实减速，速度不足时让这一发自然结束。
      if (j.vx < 0) j.vx = 0;
      j.x += j.vx * dt; j.y += j.vy * dt;
    }

    if (j.y < 0) j.y = 0;
    S.dist = Math.max(S.dist, j.x);
    S.camX = Math.max(0, j.x);
    const targetCamY = Math.max(0, j.y - H * 0.48 / PPM);
    S.camY += (targetCamY - S.camY) * Math.min(1, dt * 3);

    ensureWorld();
    checkStageTransition();

    if (S.carried <= 0) {
      checkCollisions();
      checkGroundFacilities();
    }

    if (j.y <= 0 && j.vy <= 0 && S.carried <= 0) {
      // 触地判定：先看是否触发了地面设施 (弹簧蹦床/纸板大厦/原子喷口等)
      if (!checkGroundFacilities()) {
        // 高速触地最多借力两次，避免低速滑跳无限续命。
        if (j.vx >= 22 && S.skids < level('skid')) {
          S.skids++;
          j.y = 0.5;
          j.vy = Math.max(13.5, Math.abs(j.vy) * 0.52 + 6.5);
          j.vx *= 0.88;
          S.shake = 6;
          puff(j.x, 0.5, 22, '#d4b285', 12);
          puff(j.x, 0.5, 14, '#ffd43b', 14);
          window.kaijuAudio.play('skid');
          toast('💨 特摄受身滑铲！贴地再弹起！');
          mug('^o^', '双脚擦出火花！借力再冲一波！');
        } else {
          doLanding();
        }
      }
    }
    if (S.frame % 6 === 0) updateHUD();
  }

  // ---------------- 纯一键输入绑定 ----------------
  function press() {
    window.kaijuAudio.ensure();
    if (S.frozen) return;
    switch (S.phase) {
      case 'aim':
        S.phase = 'power'; S.powerT = 0;
        window.kaijuAudio.play('lock');
        updateHUD();
        break;
      case 'power':
        window.kaijuAudio.play('lock');
        launch();
        break;
      case 'flying':
        S.holding = true;
        break;
    }
  }

  function release() {
    S.holding = false;
  }

  let workshopReturn = 'menu';
  function renderWorkshop() {
    if (!progress) return;
    $('workshopPoints').textContent = progress.data.points;
    $('workshopRuns').textContent = progress.data.runs;
    $('upgradeList').innerHTML = progress.catalog.map(item => {
      const owned = progress.data.owned[item.id] || 0, active = progress.data.equipped[item.id] || 0;
      const options = Array.from({ length: owned + 1 }, (_, n) => '<option value="' + n + '"' + (active === n ? ' selected' : '') + '>' + (n ? '等级 ' + n : '关闭 / 基础') + '</option>').join('');
      return '<div class="upgrade"><div><h3>' + item.name + ' <small>' + owned + '/3</small></h3><p>' + item.detail[active] + '</p><p class="upgrade-next">' + (owned < 3 ? '下一级：' + item.detail[owned + 1] : '已全部解锁') + '</p></div><div class="upgrade-actions"><label>使用档位 <select aria-label="' + item.name + '使用档位" data-equip="' + item.id + '">' + options + '</select></label><button data-buy="' + item.id + '"' + (owned >= 3 || progress.data.points < item.costs[owned] ? ' disabled' : '') + '>' + (owned >= 3 ? '已满级' : '解锁 · ' + item.costs[owned] + ' 点') + '</button></div></div>';
    }).join('');
  }
  function openWorkshop() {
    workshopReturn = S.phase;
    S.phase = 'workshop'; S.holding = false;
    renderWorkshop(); $('workshop').classList.remove('hidden');
  }
  function closeWorkshop() {
    $('workshop').classList.add('hidden'); S.phase = workshopReturn;
  }

  function bind() {
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', (e) => {
      if (S.phase === 'workshop') {
        if (e.key === 'Escape') closeWorkshop();
        return;
      }
      if (e.repeat) return;
      if (e.key === ' ' || e.key === '5' || e.key === 'Enter') {
        e.preventDefault();
        if (S.phase === 'menu') { startGame('distance', 0); return; }
        if (S.phase === 'result') { $('again').click(); return; }
        press();
      } else if (e.key === 'r' || e.key === 'R') {
        if (S.phase !== 'menu') startGame(S.mode, S.missionIdx);
      } else if (e.key === 'Escape') {
        showMenu();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === '5' || e.key === 'Enter') release();
    });

    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); press(); });
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    document.querySelectorAll('.modes button').forEach((b) =>
      b.addEventListener('click', (e) => { e.stopPropagation(); startGame(b.dataset.mode, 0); })
    );

    $('again').addEventListener('click', (e) => { e.stopPropagation(); startGame(S.mode, S.missionIdx); });
    $('nextMission').addEventListener('click', (e) => { e.stopPropagation(); startGame('career', S.missionIdx + 1); });
    $('paperNext').addEventListener('click', (e) => { e.stopPropagation(); startGame('career', S.missionIdx + 1); });
    $('backMenu').addEventListener('click', (e) => { e.stopPropagation(); showMenu(); });
    $('paperMenu').addEventListener('click', (e) => { e.stopPropagation(); showMenu(); });
    $('openWorkshop').addEventListener('click', openWorkshop);
    $('resultWorkshop').addEventListener('click', openWorkshop);
    $('closeWorkshop').addEventListener('click', closeWorkshop);
    $('upgradeList').addEventListener('click', e => {
      const id = e.target.dataset.buy;
      if (id && progress.buy(id)) renderWorkshop();
    });
    $('upgradeList').addEventListener('change', e => {
      const id = e.target.dataset.equip;
      if (id) { progress.equip(id, Number(e.target.value)); renderWorkshop(); }
    });

    $('soundBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      S.muted = !S.muted;
      window.kaijuAudio.muted = S.muted;
      $('soundBtn').textContent = '音效：' + (S.muted ? '关' : '开');
      if (!S.muted) window.kaijuAudio.ensure();
    });
  }

  // ---------------- 画面渲染 (特摄片场视差美学与阶段换幕) ----------------
  function drawArtSky() {
    const keys = ['city', 'stage2', 'stage3', 'stage4'];
    const art = window.kaijuArt && window.kaijuArt.get(keys[(S.stage || 1) - 1]);
    if (!art) return false;

    ctx.fillStyle = ['#93aeb9', '#8c5b42', '#122231', '#171717'][(S.stage || 1) - 1];
    ctx.fillRect(0, 0, W, H);
    // A far skyline needs only a gentle pan across the first act. This avoids
    // a visible repeat seam while the finite stage-1 panorama is on screen.
    const scale = Math.max(W / art.width, H / art.height) * 1.12;
    const artW = art.width * scale, artH = art.height * scale;
    const scroll = Math.min(artW - W, (artW - W) * 0.5 + S.camX * PPM * 0.01);
    const shiftY = Math.min(H * 0.16, S.camY * PPM * 0.05);
    ctx.drawImage(art, -scroll, Math.min(0, shiftY - (artH - H) * 0.3), artW, artH);
    return true;
  }

  function drawSky() {
    if (drawArtSky()) return;
    const stage = S.stage || 1;
    const g = ctx.createLinearGradient(0, 0, 0, H);

    if (stage === 2) {
      // 第2幕：夕阳怪兽大决战天幕
      g.addColorStop(0, '#791a1a');
      g.addColorStop(0.48, '#e8590c');
      g.addColorStop(1, '#fcc419');
    } else if (stage === 3) {
      // 第3幕：深夜东京迷你霓虹天幕
      g.addColorStop(0, '#0a0d1a');
      g.addColorStop(0.52, '#152445');
      g.addColorStop(1, '#2b3a67');
    } else if (stage === 4) {
      // 第4幕：宇宙月面特摄天幕
      g.addColorStop(0, '#030308');
      g.addColorStop(0.5, '#090a16');
      g.addColorStop(1, '#181b34');
    } else {
      // 第1幕：白昼摄影棚天幕
      g.addColorStop(0, '#339af0');
      g.addColorStop(0.55, '#74c0fc');
      g.addColorStop(1, '#ffec99');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 摄影棚特有细节：天花板高处的黑色钢架桁架与悬挂的聚光排灯
    ctx.save();
    ctx.strokeStyle = stage === 3 ? 'rgba(255, 255, 255, 0.25)' : 'rgba(33, 37, 41, 0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 24);
    ctx.lineTo(W, 24);
    for (let x = 0; x < W; x += 60) {
      ctx.moveTo(x, 0); ctx.lineTo(x + 30, 24);
      ctx.lineTo(x + 60, 0);
      // 挂在桁架上的小舞台射灯
      ctx.fillStyle = stage === 3 ? '#ffd43b' : '#495057';
      ctx.fillRect(x + 22, 24, 16, 12);
    }
    ctx.stroke();
    ctx.restore();

    // 阶段专属天体与光照
    if (stage === 2) {
      // 夕阳巨大人造赤红太阳
      ctx.fillStyle = 'rgba(255, 107, 107, 0.85)';
      ctx.beginPath();
      ctx.arc(W * 0.82, H * 0.22, 56, 0, Math.PI * 2);
      ctx.fill();
    } else if (stage === 3) {
      // 深夜探照灯光柱扫射
      ctx.save();
      ctx.fillStyle = 'rgba(255, 236, 153, 0.12)';
      const sw1 = Math.sin(S.t * 1.5) * 120;
      ctx.beginPath();
      ctx.moveTo(W * 0.2, 24);
      ctx.lineTo(W * 0.2 + sw1 - 80, H);
      ctx.lineTo(W * 0.2 + sw1 + 80, H);
      ctx.closePath();
      ctx.fill();
      const sw2 = Math.sin(S.t * 1.2 + 2) * 140;
      ctx.beginPath();
      ctx.moveTo(W * 0.75, 24);
      ctx.lineTo(W * 0.75 + sw2 - 90, H);
      ctx.lineTo(W * 0.75 + sw2 + 90, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else if (stage === 4) {
      // 宇宙星空与悬吊的特摄地球模型
      ctx.save();
      // 闪烁星星
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 28; i++) {
        const sx = ((i * 137 + S.t * 5) % (W + 40));
        const sy = (i * 47) % (H * 0.65);
        ctx.fillRect(sx, sy, (i % 3 === 0) ? 2.5 : 1.5, (i % 3 === 0) ? 2.5 : 1.5);
      }
      // 吊在威亚上的纸板地球道具
      const ex = W * 0.82, ey = H * 0.22;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex, 0); ctx.stroke();
      ctx.fillStyle = '#1c7ed6';
      ctx.beginPath(); ctx.arc(ex, ey, 38, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#40c057';
      ctx.beginPath(); ctx.arc(ex - 8, ey - 6, 16, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else {
      // 白昼人造小太阳
      ctx.fillStyle = 'rgba(255, 236, 153, 0.85)';
      ctx.beginPath();
      ctx.arc(W * 0.82, H * 0.18, 44, 0, Math.PI * 2);
      ctx.fill();
    }

    // 远景特摄微缩山峦
    const col1 = stage === 2 ? '#491217' : stage === 3 ? '#141d2f' : stage === 4 ? '#212529' : '#a9d99a';
    const col2 = stage === 2 ? '#862e9c' : stage === 3 ? '#1f2d47' : stage === 4 ? '#343a40' : '#82c982';

    const off1 = (S.camX * PPM * 0.12) % 420;
    ctx.fillStyle = col1;
    ctx.beginPath();
    ctx.moveTo(-100, gy() + 20);
    for (let x = -100; x < W + 200; x += 20) {
      ctx.lineTo(x, gy() - 28 - Math.sin((x + off1) * 0.006) * 16 - Math.sin((x + off1) * 0.013) * 9);
    }
    ctx.lineTo(W + 200, gy() + 40);
    ctx.closePath();
    ctx.fill();

    const off2 = (S.camX * PPM * 0.28) % 300;
    ctx.fillStyle = col2;
    ctx.beginPath();
    ctx.moveTo(-100, gy() + 30);
    for (let x = -100; x < W + 200; x += 16) {
      ctx.lineTo(x, gy() - 8 - Math.sin((x + off2) * 0.01) * 12);
    }
    ctx.lineTo(W + 200, gy() + 50);
    ctx.closePath();
    ctx.fill();

    // 微缩风车或微缩天线
    ctx.strokeStyle = stage === 3 ? '#ffd43b' : 'rgba(56, 102, 65, 0.55)';
    ctx.lineWidth = 3;
    for (let i = -1; i < 7; i++) {
      const bx = (i * 300 - off2 * 0.6 + 120);
      ctx.beginPath(); ctx.moveTo(bx, gy() - 8); ctx.lineTo(bx, gy() - 56); ctx.stroke();
      ctx.save();
      ctx.translate(bx, gy() - 56);
      ctx.rotate(S.t * 0.7 + i);
      for (let k = 0; k < 4; k++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -20); ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawGround() {
    const y = wy(0);
    const stage = S.stage || 1;
    // 片场地表颜色随阶段演化
    const floorColors = [
      ['#354951', '#17232a', '#c79a66'],
      ['#514037', '#20252a', '#b98859'],
      ['#263746', '#101922', '#7f93a0'],
      ['#51504e', '#222327', '#b8a888']
    ];
    const palette = floorColors[stage - 1] || floorColors[0];
    const inkFloor = ctx.createLinearGradient(0, y, 0, H);
    inkFloor.addColorStop(0, palette[0]);
    inkFloor.addColorStop(1, palette[1]);
    const groundCol = inkFloor, borderCol = palette[2];
    ctx.fillStyle = groundCol;
    ctx.fillRect(0, y, W, H - y + 300);
    ctx.fillStyle = borderCol;
    ctx.fillRect(0, y, W, 5);

    ctx.strokeStyle = 'rgba(216, 184, 135, 0.15)';
    ctx.lineWidth = 1;
    const hatch = (S.camX * PPM) % 36;
    for (let x = -H - hatch; x < W + H; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, y + 6);
      ctx.lineTo(x - (H - y) * 0.44, H);
      ctx.stroke();
    }

    // 摄影机微缩双钢轨 (地面导轨)
    ctx.strokeStyle = stage === 3 ? '#a49c7e' : '#7f8889';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y + 16);
    ctx.lineTo(W, y + 16);
    ctx.moveTo(0, y + 24);
    ctx.lineTo(W, y + 24);
    ctx.stroke();

    for (let x = -((S.camX * PPM) % 40); x < W + 40; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, y + 14);
      ctx.lineTo(x, y + 26);
      ctx.stroke();
    }

    // 绘制地面特摄设施与收场物件 (准确传入 sx 视口坐标！)
    for (let i = 0; i < S.ground.length; i++) {
      const g = S.ground[i], sx = wx(g.x);
      if (sx > -160 && sx < W + 160) {
        const art = window.kaijuArt && window.kaijuArt.get(g.type);
        if (art) {
          const scale = Math.min(g.w * PPM / art.width, Math.min(230, H * 0.36) / art.height);
          const dw = art.width * scale, dh = art.height * scale;
          ctx.globalAlpha = g.hit ? 0.55 : 1;
          ctx.drawImage(art, sx - dw / 2, y - dh, dw, dh);
          ctx.globalAlpha = 1;
        } else {
          window.drawGroundTokusatsuObj(ctx, g.type, g.w * PPM, wy(0), sx);
        }
      }
    }
  }

  function drawCannon() {
    const x = wx(0), y = wy(0);
    const cannonArt = window.kaijuArt && window.kaijuArt.get('cannon');
    if (cannonArt) {
      const width = 160, height = width * cannonArt.height / cannonArt.width;
      ctx.drawImage(cannonArt, x - width * 0.49, y - height + 13, width, height);
      if (S.phase === 'power') {
        ctx.fillStyle = 'rgba(233, 185, 96, ' + (0.18 + S.power / 300) + ')';
        ctx.beginPath();
        ctx.arc(x + 48, y - height * 0.72, 7 + S.power * 0.10, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
    ctx.save();
    ctx.translate(x, y - 14);

    // 轮式木架与场记板黑黄警示斑马条纹
    ctx.fillStyle = '#fcc419';
    window.rr(ctx, -36, -8, 72, 22, 5);
    ctx.fill();
    ctx.strokeStyle = '#212529';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 斑马条纹
    ctx.save();
    ctx.clip();
    ctx.fillStyle = '#212529';
    for (let i = -40; i < 40; i += 16) {
      ctx.beginPath();
      ctx.moveTo(i, -10);
      ctx.lineTo(i + 10, -10);
      ctx.lineTo(i + 2, 25);
      ctx.lineTo(i - 8, 25);
      ctx.fill();
    }
    ctx.restore();

    // 两个大轮子
    ctx.fillStyle = '#343a40';
    ctx.beginPath();
    ctx.arc(-22, 14, 15, 0, Math.PI * 2);
    ctx.arc(22, 14, 15, 0, Math.PI * 2);
    ctx.fill();

    // 炮管
    ctx.save();
    ctx.rotate(-S.angle * Math.PI / 180);
    ctx.fillStyle = '#e03131';
    window.rr(ctx, 0, -16, 78, 32, 8);
    ctx.fill();
    ctx.fillStyle = '#ffd43b';
    ctx.fillRect(8, -13, 62, 7);
    ctx.fillStyle = '#212529';
    window.rr(ctx, 70, -18, 10, 36, 4);
    ctx.fill();

    // 蓄力时的片场聚光辉光
    if (S.phase === 'power') {
      ctx.fillStyle = 'rgba(255, 212, 59, ' + (0.3 + S.power / 150) + ')';
      ctx.beginPath();
      ctx.arc(80, 0, 8 + S.power * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.restore();
    }

    // 虚线发射瞄准辅助线
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 9]);
    const a = S.angle * Math.PI / 180;
    ctx.beginPath();
    ctx.moveTo(x, y - 14);
    for (let i = 1; i <= 9; i++) {
      const d = i * 9, v = 42 + S.power * 0.58, t = d / v;
      ctx.lineTo(x + Math.cos(a) * d * PPM * 0.6, y - 14 - (Math.sin(a) * d - 7 * t * t) * PPM * 0.6);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawMeter() {
    const w = Math.min(420, W - 60), x = (W - w) / 2, y = H - 72;
    ctx.save();
    ctx.fillStyle = 'rgba(18, 44, 58, 0.85)';
    window.rr(ctx, x - 12, y - 32, w + 24, 62, 12);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(S.phase === 'aim' ? '① 发射仰角  ANGLE' : '② 装药力度  POWER', x, y - 12);

    ctx.fillStyle = '#212529';
    window.rr(ctx, x, y, w, 16, 8);
    ctx.fill();

    const v = S.phase === 'aim' ? (S.angle - 12) / 66 : S.power / 100;
    ctx.fillStyle = S.phase === 'aim' ? '#89a7ad' : '#d2b477';
    window.rr(ctx, x + 2, y + 2, Math.max(6, (w - 4) * v), 12, 6);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.textAlign = 'right';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(S.phase === 'aim' ? S.angle.toFixed(0) + '°' : S.power.toFixed(0) + '%', x + w, y - 12);

    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('按 空格 / 鼠标点击 锁定', W / 2, y + 44);
    ctx.restore();
  }

  function render() {
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();

    if (S.shake > 0) {
      ctx.translate((Math.random() - 0.5) * S.shake, (Math.random() - 0.5) * S.shake);
    }

    drawSky();
    drawGround();

    if (S.phase === 'aim' || S.phase === 'power') drawCannon();

    // 绘制空中特摄机关与怪兽
    for (let i = 0; i < S.air.length; i++) {
      const e = S.air[i], sx = wx(e.x), sy = wy(e.y);
      if (sx > -200 && sx < W + 200 && sy > -300 && sy < H + 300) {
        ctx.globalAlpha = e.hit ? 0.3 : 1;
        const artName = e.type === 'mothra' ? 'moth' : e.type;
        const airArt = window.kaijuArt && (['moth', 'rodan'].includes(artName) ? window.kaijuArt.frame(artName, S.t + e.ph) : window.kaijuArt.get(artName));
        if (airArt) {
          const wingRoom = ['moth', 'rodan'].includes(artName) ? 1.6 : 1;
          const scale = Math.min(e.w * PPM / airArt.width, e.h * PPM * wingRoom / airArt.height);
          const dw = airArt.width * scale, dh = airArt.height * scale;
          ctx.save();
          ctx.translate(sx + Math.sin(S.t * 1.4 + e.ph) * 3, sy + Math.sin(S.t * 2 + e.ph) * 4);
          ctx.rotate(Math.sin(S.t * 1.7 + e.ph) * 0.025);
          const beat = [0, 1, 0, -1][Math.floor((S.t + e.ph) * 4) % 4];
          if (['cloud', 'oilrig', 'balloon', 'gillas'].includes(artName)) ctx.scale(1 + beat * 0.025, 1 - beat * 0.025);
          ctx.drawImage(airArt, -dw / 2, -dh / 2, dw, dh);
          ctx.restore();
        } else {
          window.drawTokusatsuAirEntity(ctx, e, sx, sy, PPM, S.t);
        }
        ctx.globalAlpha = 1;
      }
    }

    // 粒子效果
    for (let i = 0; i < S.particles.length; i++) {
      const p = S.particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      const px = wx(p.x), py = wy(p.y), size = p.size;
      ctx.beginPath();
      ctx.moveTo(px - size, py); ctx.lineTo(px + size * 0.35, py - size * 0.55);
      ctx.lineTo(px + size * 1.4, py + size * 0.2); ctx.lineTo(px, py + size * 0.6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 绘制主角小朋友
    const jx = wx(S.j.x), jy = wy(S.j.y);
    if (S.phase === 'flying' || S.phase === 'landing') {
      if (S.phase === 'landing') {
        ctx.save();
        ctx.translate(jx, wy(0));
        ctx.scale(1.25, 1.25);
        window.drawTokusatsuLandingVignette(ctx, S.landingType, 0, 0, 0.58, S.landingT, 360, 260);
        ctx.restore();
      } else {
        const rot = S.spin > 0 ? S.t * 14 : clamp(Math.atan2(-S.j.vy, Math.max(1, S.j.vx)) * 0.55, -0.6, 0.9);
        const pilotPose = S.holding && S.j.energy > 0 ? 'pilotFlap' : S.j.vy < -8 ? 'pilotDive' : 'pilot';
        const pilotArt = window.kaijuArt && (pilotPose === 'pilotFlap' ? window.kaijuArt.frame('pilot', S.t) : window.kaijuArt.get(pilotPose) || window.kaijuArt.get('pilot'));
        const showBones = S.skeleton > 0 && Math.sin(S.t * 40) > -0.2;
        if (pilotArt) {
          const spriteW = W < 600 ? 106 : 122, spriteH = spriteW * pilotArt.height / pilotArt.width;
          ctx.save();
          ctx.translate(jx, jy);
          ctx.rotate(rot + (S.holding ? Math.sin(S.j.arm) * 0.035 : 0));
          if (showBones) ctx.filter = 'grayscale(1) brightness(2.4) contrast(1.6)';
          ctx.drawImage(pilotArt, -spriteW * 0.57, -spriteH * 0.5, spriteW, spriteH);
          ctx.restore();
        } else {
          window.drawKidCharacter(ctx, jx, jy, 46, {
            rot: rot,
            arm: S.j.arm,
            flapping: S.holding && S.j.energy > 0,
            bones: showBones,
            sx: 1, sy: 1
          });
        }

        // 被拉顿或摩斯拉带飞时，在头顶画出抓着书包的怪兽模型
        if (S.carried > 0 && S.carryType) {
          const carrier = window.kaijuArt && window.kaijuArt.frame(S.carryType === 'mothra' ? 'moth' : 'rodan', S.t);
          if (carrier) {
            const width = W < 600 ? 145 : 185, height = width * carrier.height / carrier.width;
            ctx.drawImage(carrier, jx - width / 2, jy - height - 20 + Math.sin(S.t * 3) * 3, width, height);
          }
        }

        // 速度线特效
        if (S.j.vx > 54) {
          ctx.fillStyle = S.stage >= 3 ? 'rgba(216, 201, 170, 0.38)' : 'rgba(32, 38, 40, 0.35)';
          for (let i = 0; i < 7; i++) {
            const yy = (i * 97 + S.t * 260) % (H + 80) - 40;
            ctx.beginPath();
            ctx.moveTo(jx - 60 - i * 22, yy);
            ctx.lineTo(jx - 150 - i * 22, yy - 1.5);
            ctx.lineTo(jx - 130 - i * 22, yy + 2);
            ctx.closePath(); ctx.fill();
          }
        }

        // 离地高度指示计
        if (wy(0) > H - 10) {
          ctx.fillStyle = 'rgba(18, 44, 58, 0.75)';
          window.rr(ctx, W / 2 - 76, H - 38, 152, 26, 9);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('离地高度 ' + Math.round(S.j.y) + ' m  ↓', W / 2, H - 20);
        }
      }
    }

    ctx.restore();

    if (S.phase === 'aim' || S.phase === 'power') drawMeter();
    if (S.flash > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + Math.min(0.85, S.flash) + ')';
      ctx.fillRect(0, 0, W, H);
    }
    if (S.phase === 'flying' && S.j.energy <= 0) {
      ctx.fillStyle = 'rgba(224, 49, 49, 0.9)';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('体力耗尽！进入自然滑翔！', W / 2, 90);
    }
  }

  // ---------------- 主循环 ----------------
  let last = 0, acc = 0;
  function loop(now) {
    if (!last) last = now;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!S.frozen) {
      acc += dt;
      let guard = 0;
      while (acc >= 1 / 60 && guard++ < 6) {
        step(1 / 60);
        acc -= 1 / 60;
      }
    }
    render();
    requestAnimationFrame(loop);
  }

  // ---------------- 自检测试工具 (验证核心循环) ----------------
  function runTests() {
    S.testMode = true;
    const checks = {}, states = [];
    const A = (k, v) => { checks[k] = !!v; };
    const snap = () => states.push(S.phase);
    try {
      showMenu(); A('menu_initial', S.phase === 'menu'); snap();
      startGame('distance', 0); A('start_aim', S.phase === 'aim'); snap();
      for (let i = 0; i < 20; i++) step(1 / 60);
      const a0 = S.angle;
      for (let i = 0; i < 20; i++) step(1 / 60);
      A('angle_moves', Math.abs(S.angle - a0) > 1);
      press(); A('aim_to_power', S.phase === 'power'); snap(); release();
      for (let i = 0; i < 40; i++) step(1 / 60);
      A('power_moves', S.power > 8 && S.power < 100);
      press(); A('launch_flying', S.phase === 'flying'); snap(); release();
      A('launch_vx', S.j.vx > 10 && S.j.vy > 0);

      S.holding = true;
      const e0 = S.j.energy;
      for (let i = 0; i < 120; i++) step(1 / 60);
      A('energy_drains', S.j.energy < e0 - 10);
      for (let i = 0; i < 600; i++) step(1 / 60);
      A('energy_nonnegative', S.j.energy >= 0);
      A('still_airborne_or_landed', S.phase === 'flying' || S.phase === 'landing' || S.phase === 'result');
      S.holding = false;

      // 验证拉顿与摩斯拉的差异
      startGame('distance', 0); press(); press(); S.holding = false;
      S.j = { x: 100, y: 40, vx: 50, vy: 0, energy: 40, arm: 0 }; S.phase = 'flying';
      hit(makeEnt('rodan', 100, 40, Math.random));
      A('rodan_boosts_vx', S.j.vx > 70 && S.carried > 0 && S.carryType === 'rodan');
      S.carried = 0;

      hit(makeEnt('mothra', 100, 40, Math.random));
      A('mothra_recharges', S.j.energy === Math.min(maxEnergy(), 60 + level('moth') * 15) && S.carried > 0 && S.carryType === 'mothra');
      S.carried = 0;

      // 验证地面设施与弹跳受身
      startGame('distance', 0); press(); press(); S.holding = false;
      S.j = { x: 50, y: 1, vx: 30, vy: -5, energy: 50, arm: 0 }; S.phase = 'flying';
      triggerGroundFacility(makeGround('trampoline', 50, true));
      A('trampoline_boost', S.j.vy > 30 && S.events['trampoline'] > 0);

      // 验证贴地滑跳机制
      S.loadout.skid = 1; S.ground = []; S.air = []; S.genX = 1e6;
      S.j = { x: 80, y: 0, vx: 25, vy: -10, energy: 10, arm: 0 }; S.phase = 'flying';
      step(1 / 60);
      A('ground_skid_bounce', S.j.vy > 10 && S.phase === 'flying');

      // 验证安吉拉斯和背景画布的收场
      A('all_landings', Object.keys(window.TOKUSATSU_LANDINGS).length === 8 &&
        Object.keys(window.TOKUSATSU_LANDINGS).every(k => !!window.TOKUSATSU_LANDINGS[k].head));

      doLanding('anguirus');
      A('anguirus_landing', S.landingType === 'anguirus');

      A('state_sequence', states.join('>').indexOf('menu>aim>power>flying') === 0);
    } catch (err) {
      checks['EXCEPTION'] = String(err && err.stack || err);
    }

    const failed = Object.keys(checks).filter(k => !checks[k]);
    const out = { pass: failed.length === 0, failed: failed, checks: checks, states: states };
    $('test-out').textContent = JSON.stringify(out);
    document.title = failed.length === 0 ? 'KAIJUFLY TEST PASS' : 'KAIJUFLY TEST FAIL';
    S.frozen = true; showMenu(); render();
  }

  // ---------------- 启动入口 ----------------
  resize();
  bind();
  loadBest();

  const q = new URLSearchParams(location.search);
  if (q.get('test') === '1') {
    runTests();
  } else if (q.get('artpreview') === 'paper') {
    startGame('career', 0);
    S.landingType = 'anguirus';
    S.frozen = true;
    setTimeout(() => showPaper(900, 1500), 800);
  } else if (q.has('artpreview')) {
    const previewStage = clamp(Number(q.get('artpreview')) || 1, 1, 4);
    const previewAir = ['mothra', 'rodan', 'gillas', 'oilrig'];
    const previewGround = ['trampoline', 'anguirus', 'ultraman', 'dolly'];
    startGame('distance', 0);
    S.phase = 'flying';
    S.j = { x: 300, y: 24, vx: 48, vy: 0, energy: 72, arm: 0 };
    S.dist = 300; S.camX = 300; S.camY = 0; S.stage = previewStage;
    S.air = [makeEnt(previewAir[previewStage - 1], 300 + W * 0.4 / PPM, 30, rnd32(9))];
    S.ground = [makeGround(previewGround[previewStage - 1], 300 + W * 0.36 / PPM)];
    S.frozen = true;
    updateHUD();
    $('tip').textContent = '按住挥臂爬升，松开滑翔 · 完成飞行获得片场点数';
  } else {
    showMenu();
  }

  requestAnimationFrame(loop);
  window.__KAIJU__ = {
    S: S, step: step, press: press, release: release,
    startGame: startGame, hit: hit, doLanding: doLanding,
    showResult: showResult, render: render, runTests: runTests
  };
})();
