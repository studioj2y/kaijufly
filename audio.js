// ==========================================================================
// KAIJU FLY - Web Audio 特摄音效合成器 (零外部文件依赖)
// ==========================================================================

class KaijuAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (this.muted) return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  tone(f0, f1, dur, type = 'sine', vol = 0.08, delay = 0) {
    if (this.muted || !this.ctx) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t0 + dur);
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (e) {}
  }

  noise(dur, vol = 0.12, delay = 0) {
    if (this.muted || !this.ctx) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const n = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const src = this.ctx.createBufferSource();
      const gain = this.ctx.createGain();
      src.buffer = buf;
      gain.gain.setValueAtTime(vol, t0);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(gain);
      gain.connect(this.ctx.destination);
      src.start(t0);
    } catch (e) {}
  }

  play(name) {
    this.ensure();
    if (this.muted || !this.ctx) return;

    switch (name) {
      case 'lock':
        // 卡嗒锁定仰角/力度
        this.tone(540, 780, 0.08, 'square', 0.07);
        break;

      case 'launch':
        // 特摄大炮轰鸣 + 火药爆风
        this.tone(190, 40, 0.45, 'sawtooth', 0.18);
        this.noise(0.35, 0.22);
        break;

      case 'flap':
        // 小朋友挥动双臂呼哧声
        this.tone(320, 180, 0.07, 'triangle', 0.04);
        break;

      case 'rodan':
        // 拉顿！超音速音爆 + 尖锐怪鸟破空声
        this.tone(880, 440, 0.35, 'sawtooth', 0.12);
        this.tone(360, 90, 0.45, 'triangle', 0.15, 0.05);
        this.noise(0.4, 0.2);
        break;

      case 'mothra':
        // 摩斯拉！神圣风铃与治愈鳞粉闪烁音
        [523, 659, 784, 1047, 1318].forEach((f, i) => {
          this.tone(f, f * 1.05, 0.25, 'sine', 0.07, i * 0.06);
        });
        break;

      case 'gillas':
        // 基拉斯旋转！双怪兽呼啸旋涡
        this.tone(120, 480, 0.35, 'sawtooth', 0.14);
        this.tone(480, 140, 0.35, 'sawtooth', 0.14, 0.1);
        this.noise(0.5, 0.22);
        break;

      case 'beam':
        // 哥斯拉原子吐息！高能热线激射
        this.tone(200, 1200, 0.22, 'sawtooth', 0.16);
        this.tone(800, 200, 0.3, 'square', 0.12, 0.1);
        this.noise(0.35, 0.2);
        break;

      case 'spark':
        // 特斯拉人工闪电噼里啪啦
        this.noise(0.3, 0.22);
        this.tone(1500, 180, 0.3, 'square', 0.09);
        this.tone(90, 40, 0.4, 'sawtooth', 0.12);
        break;

      case 'boing':
        // 哥斯拉橡胶肚皮软弹
        this.tone(220, 820, 0.25, 'sine', 0.15);
        break;

      case 'tear':
        // 划破短裤 / 穿透画布扑哧声
        this.noise(0.18, 0.25);
        this.tone(450, 120, 0.15, 'sawtooth', 0.1);
        break;

      case 'pickup':
        // 获得便当/果汁补充
        this.tone(700, 1250, 0.14, 'square', 0.08);
        break;

      case 'hit':
        // 碰撞微型模型
        this.tone(320, 120, 0.12, 'square', 0.09);
        this.noise(0.1, 0.08);
        break;

      case 'crash':
        // 落地大特写
        this.tone(150, 36, 0.5, 'sawtooth', 0.18);
        this.noise(0.35, 0.22);
        break;

      case 'win':
        // 特摄战队胜利简短号角
        [523, 659, 784, 1047].forEach((f, i) => {
          this.tone(f, f * 1.02, 0.16, 'square', 0.09, i * 0.1);
        });
        break;

      case 'fail':
        // 幽默滑稽收场
        [349, 293, 261].forEach((f, i) => {
          this.tone(f, f * 0.88, 0.22, 'triangle', 0.09, i * 0.12);
        });
        break;
    }
  }
}

window.kaijuAudio = new KaijuAudio();
