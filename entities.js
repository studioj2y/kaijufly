// ==========================================================================
// KAIJU FLY - 特摄角色、怪兽道具与实体渲染模块
// ==========================================================================

// 辅助几何绘制
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function star(ctx, x, y, r, n, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  for (let i = 0; i < n * 2; i++) {
    const a = (i * Math.PI) / n - Math.PI / 2;
    const rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

// --------------------------------------------------------------------------
// 1. 主角小朋友 (The Kid Explorer)
// --------------------------------------------------------------------------
function drawKidCharacter(ctx, x, y, size, o = {}) {
  const u = size / 3.4; // 比例缩放单位
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(o.rot || 0);
  ctx.scale(u * (o.sx || 1), u * (o.sy || 1));

  const arm = o.arm || 0;
  const fl = Math.sin(arm) * 0.6;
  const bones = o.bones; // 触电骨骼 X 光特效

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 倒栽葱模式（只露出小雨靴在外面倒蹬）
  if (o.legsOnly) {
    ctx.strokeStyle = bones ? '#fff' : '#1971c2';
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(-0.35, 0);
    ctx.lineTo(-0.45, -1.15 + Math.sin(arm * 2) * 0.14);
    ctx.moveTo(0.35, 0);
    ctx.lineTo(0.5, -1.15 - Math.sin(arm * 2) * 0.14);
    ctx.stroke();

    // 亮黄色小雨靴
    ctx.fillStyle = bones ? '#fff' : '#fcc419';
    ctx.beginPath();
    ctx.ellipse(-0.47, -1.2, 0.3, 0.18, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0.52, -1.2, 0.3, 0.18, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  // 双腿与小雨靴
  if (o.tearPants) {
    // 裤子被安吉拉斯尖刺划破！露出红心卡通平角短裤！
    ctx.fillStyle = '#ffffff';
    rr(ctx, -0.6, 0.1, 1.2, 0.6, 0.15);
    ctx.fill();
    // 红色小爱心印花
    ctx.fillStyle = '#e03131';
    ctx.beginPath();
    ctx.arc(-0.2, 0.35, 0.1, 0, Math.PI * 2);
    ctx.arc(0.2, 0.35, 0.1, 0, Math.PI * 2);
    ctx.fill();
    // 撕裂布料边缘
    ctx.strokeStyle = '#1971c2';
    ctx.lineWidth = 0.15;
    ctx.beginPath();
    ctx.moveTo(-0.55, 0.65);
    ctx.lineTo(-0.3, 0.85);
    ctx.lineTo(0, 0.65);
    ctx.lineTo(0.3, 0.85);
    ctx.stroke();
  } else {
    // 正常深蓝色牛仔短裤
    ctx.strokeStyle = bones ? '#f1f3f5' : '#1864ab';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-0.25, 0.15);
    ctx.lineTo(-0.5, 1.35);
    ctx.moveTo(0.25, 0.15);
    ctx.lineTo(0.55, 1.35);
    ctx.stroke();
  }

  // 黄色小雨靴
  ctx.fillStyle = bones ? '#f1f3f5' : '#fcc419';
  rr(ctx, -0.92, 1.25, 0.9, 0.36, 0.16);
  ctx.fill();
  rr(ctx, 0.22, 1.25, 0.9, 0.36, 0.16);
  ctx.fill();

  // 双肩书包（背在身后）
  ctx.fillStyle = '#fab005';
  rr(ctx, -0.9, -1.2, 0.45, 1.3, 0.2);
  ctx.fill();

  // 躯干：亮红色运动防风马甲 + 内衬明黄色 T 恤
  ctx.fillStyle = bones ? '#e9ecef' : '#e03131';
  rr(ctx, -0.72, -1.25, 1.44, 1.65, 0.4);
  ctx.fill();

  if (!bones) {
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(-0.4, -1.2, 0.8, 1.55);
    // 衣服上的五星或微缩怪兽爪印徽章
    star(ctx, 0, -0.45, 0.3, 5, '#e03131');
  } else {
    // 骨骼肋骨 X 光
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 0.12;
    ctx.beginPath();
    ctx.moveTo(0, -1.15);
    ctx.lineTo(0, 0.4);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, -0.95 + i * 0.34);
      ctx.quadraticCurveTo(0.6, -0.9 + i * 0.34, 0.5, -0.65 + i * 0.34);
      ctx.moveTo(0, -0.95 + i * 0.34);
      ctx.quadraticCurveTo(-0.6, -0.9 + i * 0.34, -0.5, -0.65 + i * 0.34);
      ctx.stroke();
    }
  }

  // 双臂（像小鸟一样上下挥舞扑腾！）
  ctx.strokeStyle = bones ? '#f1f3f5' : '#e03131';
  ctx.lineWidth = 0.48;
  const ay = o.flapping ? -1.05 + fl * 0.55 : -0.75 + Math.sin(arm) * 0.22;
  ctx.beginPath();
  ctx.moveTo(-0.62, -1.02);
  ctx.lineTo(-1.35, ay);
  ctx.moveTo(0.62, -1.02);
  ctx.lineTo(1.35, ay);
  ctx.stroke();

  // 肉肉的小手掌
  ctx.fillStyle = bones ? '#f1f3f5' : '#ffc9c9';
  ctx.beginPath();
  ctx.arc(-1.4, ay, 0.24, 0, Math.PI * 2);
  ctx.arc(1.4, ay, 0.24, 0, Math.PI * 2);
  ctx.fill();

  // 头部 + 复古特摄飞行小头盔 / 护目镜
  ctx.fillStyle = bones ? '#f8f9fa' : '#ffe8cc';
  ctx.beginPath();
  ctx.arc(0, -1.72, 0.56, 0, Math.PI * 2);
  ctx.fill();

  if (!bones) {
    // 栗色刘海
    ctx.fillStyle = '#5c3a21';
    ctx.beginPath();
    ctx.arc(0, -1.82, 0.56, Math.PI * 0.8, Math.PI * 2.2);
    ctx.fill();

    // 飞行护目镜（卡在额头上）
    ctx.fillStyle = '#343a40';
    rr(ctx, -0.62, -2.18, 1.24, 0.32, 0.12);
    ctx.fill();
    // 护目镜双透镜（翠绿反光）
    ctx.fillStyle = '#69db7c';
    ctx.beginPath();
    ctx.ellipse(-0.3, -2.02, 0.22, 0.14, 0, 0, Math.PI * 2);
    ctx.ellipse(0.3, -2.02, 0.22, 0.14, 0, 0, Math.PI * 2);
    ctx.fill();

    // 表情绘制
    if (o.blushing) {
      // 脸红晕染
      ctx.fillStyle = 'rgba(255, 107, 107, 0.65)';
      ctx.beginPath();
      ctx.arc(-0.32, -1.58, 0.14, 0, Math.PI * 2);
      ctx.arc(0.32, -1.58, 0.14, 0, Math.PI * 2);
      ctx.fill();
    }

    // 灵动大眼睛
    ctx.fillStyle = '#212529';
    if (o.dizzyHappy) {
      // 螺旋蚊香眼 @_@
      ctx.strokeStyle = '#212529';
      ctx.lineWidth = 0.08;
      ctx.beginPath();
      ctx.arc(-0.22, -1.68, 0.12, 0, Math.PI * 3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0.22, -1.68, 0.12, 0, Math.PI * 3);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-0.2, -1.68, 0.08, 0, Math.PI * 2);
      ctx.arc(0.2, -1.68, 0.08, 0, Math.PI * 2);
      ctx.fill();
      // 高光
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-0.23, -1.71, 0.035, 0, Math.PI * 2);
      ctx.arc(0.17, -1.71, 0.035, 0, Math.PI * 2);
      ctx.fill();
    }

    // 兴奋张开的大笑嘴巴
    ctx.fillStyle = '#e03131';
    ctx.beginPath();
    ctx.arc(0, -1.48, 0.22, 0.2, Math.PI - 0.2);
    ctx.fill();
  }

  ctx.restore();
}

// --------------------------------------------------------------------------
// 2. 空中特摄道具渲染 (Rodan, Mothra, Gillas, Godzilla, Jet, Tesla, etc.)
// --------------------------------------------------------------------------

function drawTokusatsuAirEntity(ctx, e, sx, sy, PPM, time) {
  const px = e.w * PPM;
  const py = e.h * PPM;
  ctx.save();
  ctx.translate(sx, sy);

  // 绝妙细节：绝大多数特摄飞行模型都隐约连着两根细细的【摄影威亚钢丝】！
  if (['rodan', 'mothra', 'plane', 'gamera'].includes(e.type)) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-px * 0.18, -py * 0.4);
    ctx.lineTo(-px * 0.18, -300); // 向上延伸到摄影棚吊架
    ctx.moveTo(px * 0.18, -py * 0.4);
    ctx.lineTo(px * 0.18, -300);
    ctx.stroke();
    ctx.restore();
  }

  switch (e.type) {
    // ------------------------------------------------------------------------
    // ① 拉顿 (Rodan / 火山翼龙)：超音速俯冲掠空，极速向前拖拽！
    // ------------------------------------------------------------------------
    case 'rodan': {
      const f = Math.sin(time * 12 + e.ph) * 0.5;
      // 暗红岩浆色巨翼
      ctx.fillStyle = '#7a2818';
      ctx.beginPath();
      ctx.moveTo(-px * 0.1, 0);
      ctx.quadraticCurveTo(-px * 0.48, -py * 0.65 + f * px * 0.25, -px * 0.58, -py * 0.1);
      ctx.quadraticCurveTo(-px * 0.32, py * 0.2, -px * 0.05, py * 0.15);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(px * 0.1, 0);
      ctx.quadraticCurveTo(px * 0.48, -py * 0.65 + f * px * 0.25, px * 0.58, -py * 0.1);
      ctx.quadraticCurveTo(px * 0.32, py * 0.2, px * 0.05, py * 0.15);
      ctx.fill();

      // 躯干与胸甲尖刺
      ctx.fillStyle = '#5c1d11';
      ctx.beginPath();
      ctx.ellipse(0, 0, px * 0.24, py * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();

      // 凶猛尖喙与头后双角
      ctx.fillStyle = '#e8590c';
      ctx.beginPath();
      ctx.moveTo(px * 0.25, -py * 0.1);
      ctx.lineTo(px * 0.48, 0);
      ctx.lineTo(px * 0.25, py * 0.08);
      ctx.fill();

      // 凶悍黄眼
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.arc(px * 0.22, -py * 0.1, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // ------------------------------------------------------------------------
    // ② 摩斯拉 (Mothra / 巨蛾女神)：华丽展翅，洒落漫天治愈神圣鳞粉，体力暴涨！
    // ------------------------------------------------------------------------
    case 'mothra': {
      const f = Math.sin(time * 8 + e.ph) * 0.4;
      // 经典华丽红黄黑斑斓巨翅
      ctx.fillStyle = '#f76707'; // 亮橙底色
      ctx.beginPath();
      ctx.ellipse(-px * 0.28, -py * 0.15 + f * 5, px * 0.28, py * 0.38, -0.2, 0, Math.PI * 2);
      ctx.ellipse(px * 0.28, -py * 0.15 + f * 5, px * 0.28, py * 0.38, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // 翅膀黑黄同心圆眼斑 (Mothra signature pattern)
      ctx.fillStyle = '#ffd43b';
      ctx.beginPath();
      ctx.arc(-px * 0.28, -py * 0.25 + f * 5, px * 0.1, 0, Math.PI * 2);
      ctx.arc(px * 0.28, -py * 0.25 + f * 5, px * 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#212529';
      ctx.beginPath();
      ctx.arc(-px * 0.28, -py * 0.25 + f * 5, px * 0.05, 0, Math.PI * 2);
      ctx.arc(px * 0.28, -py * 0.25 + f * 5, px * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // 毛茸茸白色躯干与大蓝眼
      ctx.fillStyle = '#f8f9fa';
      ctx.beginPath();
      ctx.ellipse(0, 0, px * 0.14, py * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      // 标志性亮青色宝石大复眼
      ctx.fillStyle = '#22b8cf';
      ctx.beginPath();
      ctx.arc(-px * 0.08, -py * 0.18, 5, 0, Math.PI * 2);
      ctx.arc(px * 0.08, -py * 0.18, 5, 0, Math.PI * 2);
      ctx.fill();

      // 周围散落闪闪发光的治愈神圣金粉粒子
      for (let i = 0; i < 4; i++) {
        const sx = Math.sin(time * 6 + i) * px * 0.4;
        const sy = py * 0.3 + (i * 8);
        ctx.fillStyle = i % 2 ? '#ffe066' : '#66d9e8';
        ctx.beginPath();
        ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    // ------------------------------------------------------------------------
    // ③ 雷欧奥特曼第一集：孪生怪兽「基拉斯兄弟」合体旋转飓风！
    // ------------------------------------------------------------------------
    case 'gillas': {
      ctx.save();
      ctx.translate(0, -py * 0.5);

      // 电机旋转底座
      ctx.fillStyle = '#343a40';
      ctx.fillRect(-px * 0.35, py - 6, px * 0.7, 10);

      // 红基拉斯与黑基拉斯相拥在飓风中心高速旋转
      ctx.save();
      ctx.translate(0, py * 0.5);
      ctx.rotate(time * 16);

      // 红基拉斯 (Red Gillas)
      ctx.fillStyle = '#e03131';
      ctx.beginPath();
      ctx.arc(-px * 0.16, 0, px * 0.18, 0, Math.PI * 2);
      ctx.fill();
      // 头部弯角
      ctx.fillStyle = '#f08c00';
      ctx.beginPath();
      ctx.moveTo(-px * 0.24, -px * 0.12);
      ctx.lineTo(-px * 0.34, -px * 0.28);
      ctx.lineTo(-px * 0.14, -px * 0.2);
      ctx.fill();

      // 黑基拉斯 (Black Gillas)
      ctx.fillStyle = '#212529';
      ctx.beginPath();
      ctx.arc(px * 0.16, 0, px * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f08c00';
      ctx.beginPath();
      ctx.moveTo(px * 0.24, px * 0.12);
      ctx.lineTo(px * 0.34, px * 0.28);
      ctx.lineTo(px * 0.14, px * 0.2);
      ctx.fill();
      ctx.restore();

      // 旋转激起的狂暴纸屑烟尘气旋
      const wob = (yy) => Math.sin(yy * 0.05 + time * 6) * px * 0.12;
      ctx.beginPath();
      for (let i = 0; i <= 16; i++) {
        const k = i / 16, yy = py * k, w = px * (0.6 - k * 0.48);
        ctx.lineTo(-w + wob(yy), yy);
      }
      for (let i = 16; i >= 0; i--) {
        const k = i / 16, yy = py * k, w = px * (0.6 - k * 0.48);
        ctx.lineTo(w + wob(yy), yy);
      }
      ctx.closePath();

      const gr = ctx.createLinearGradient(-px * 0.5, 0, px * 0.5, 0);
      gr.addColorStop(0, 'rgba(255, 107, 107, 0.25)');
      gr.addColorStop(0.5, 'rgba(255, 236, 153, 0.55)');
      gr.addColorStop(1, 'rgba(33, 37, 41, 0.25)');
      ctx.fillStyle = gr;
      ctx.fill();

      // 旋转风暴中的特摄飞散纸片与火星
      for (let i = 0; i < 6; i++) {
        const ang = time * 8 + i * 1.1;
        const dist = px * (0.2 + (i % 3) * 0.12);
        ctx.fillStyle = i % 2 ? '#ff6b6b' : '#ffe066';
        ctx.fillRect(Math.cos(ang) * dist, py * 0.3 + Math.sin(ang) * 16, 6, 4);
      }

      ctx.restore();
      break;
    }

    // ------------------------------------------------------------------------
    // ④ 加美拉收壳旋转飞行（素材未加载时的简化回退）
    // ------------------------------------------------------------------------
    case 'gamera': {
      ctx.save();ctx.scale(1,0.65);ctx.rotate(time*6.28);
      for(let i=0;i<4;i++){
        ctx.rotate(Math.PI/2);ctx.fillStyle='#75bad6';ctx.beginPath();
        ctx.moveTo(px*.25,-px*.04);ctx.lineTo(px*.48,-px*.12);ctx.lineTo(px*.3,px*.06);ctx.fill();
      }
      ctx.fillStyle='#3c4a43';ctx.strokeStyle='#b0a58c';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,0,px*.3,px*.28,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      for(let i=0;i<6;i++){ctx.rotate(Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(px*.28,0);ctx.stroke();}
      ctx.restore();
      break;
    }

    // ------------------------------------------------------------------------
    // ⑤ 特搜队胜利飞燕战机 (Jet Fighter)：微缩战机掠过强风推力！
    // ------------------------------------------------------------------------
    case 'plane': {
      // 科特队经典白红黄流线型机身
      ctx.fillStyle = '#f8f9fa';
      rr(ctx, -px * 0.45, -py * 0.12, px * 0.85, py * 0.24, 6);
      ctx.fill();
      // 红色箭头机翼
      ctx.fillStyle = '#e03131';
      ctx.beginPath();
      ctx.moveTo(-px * 0.2, -py * 0.42);
      ctx.lineTo(px * 0.15, -py * 0.12);
      ctx.lineTo(-px * 0.3, -py * 0.12);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-px * 0.2, py * 0.42);
      ctx.lineTo(px * 0.15, py * 0.12);
      ctx.lineTo(-px * 0.3, py * 0.12);
      ctx.fill();

      // 驾驶舱金黄遮罩
      ctx.fillStyle = '#ffd43b';
      rr(ctx, px * 0.05, -py * 0.08, px * 0.22, py * 0.16, 3);
      ctx.fill();

      // 尾部离子加速推力火焰
      ctx.fillStyle = '#339af0';
      ctx.beginPath();
      ctx.moveTo(-px * 0.45, -py * 0.08);
      ctx.lineTo(-px * 0.65 - Math.sin(time * 25) * 8, 0);
      ctx.lineTo(-px * 0.45, py * 0.08);
      ctx.fill();
      break;
    }

    // ------------------------------------------------------------------------
    // ⑥ 引力射线：暗云内部的金色电光。
    // ------------------------------------------------------------------------
    case 'cloud': {
      // 烟雾机喷出的灰白特摄云团
      ctx.fillStyle = '#303436';
      ctx.beginPath();
      ctx.arc(-px * 0.2, 0, px * 0.24, 0, Math.PI * 2);
      ctx.arc(0, -py * 0.18, px * 0.3, 0, Math.PI * 2);
      ctx.arc(px * 0.22, 0, px * 0.24, 0, Math.PI * 2);
      ctx.fill();

      // 云层内部隐约闪现金色分叉，素材缺失时仍保持同一含义。
      ctx.strokeStyle = '#d3b56c';
      ctx.lineWidth = 2;
      const f = Math.sin(time * 14 + e.ph) > 0.35 ? 1 : 0;
      if (f) {
        ctx.beginPath();
        ctx.moveTo(px * 0.05, -py * 0.35);
        ctx.lineTo(-px * 0.08, -py * 0.1);
        ctx.lineTo(px * 0.05, 0);
        ctx.lineTo(-px * 0.08, py * 0.17);
        ctx.stroke();
      }
      break;
    }

    // ------------------------------------------------------------------------
    // ⑦ 哥斯拉原子吐息喷口 (Oilrig)：蓝色热核光柱冲天！
    // ------------------------------------------------------------------------
    case 'oilrig': {
      // 摄影棚工业喷射管架
      ctx.fillStyle = '#343a40';
      ctx.fillRect(-px * 0.2, py * 0.15, px * 0.4, py * 0.35);

      // 汹涌直冲云霄的蓝白色原子热线！
      ctx.fillStyle = '#4dabf7';
      for (let i = 0; i < 5; i++) {
        const yy = -py * 0.4 - i * 12 - Math.sin(time * 8 + i) * 6;
        ctx.beginPath();
        ctx.arc(Math.sin(time * 4 + i) * 8, yy, 6 + i * 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(0, -py * 0.2, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    // ------------------------------------------------------------------------
    // ⑧ 骑士推进糖果 (Chili) & 剧组高能便当 (Can) & 小巴尔坦 (Birds)
    // ------------------------------------------------------------------------
    case 'chili': {
      // 假面骑士红金火箭推进糖果
      ctx.fillStyle = '#e03131';
      rr(ctx, -px * 0.3, -py * 0.4, px * 0.6, py * 0.8, 5);
      ctx.fill();
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(-px * 0.3, -py * 0.1, px * 0.6, py * 0.2);
      break;
    }

    case 'can': {
      // 剧组 M87 能量维他命果汁罐
      ctx.fillStyle = '#22b8cf';
      rr(ctx, -px * 0.28, -py * 0.42, px * 0.56, py * 0.84, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('M87', 0, 4);
      break;
    }

    case 'birds': {
      // 迷你飞天小巴尔坦星人模型群
      ctx.strokeStyle = '#495057';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) {
        const bx = (i - 1.5) * px * 0.22;
        const by = Math.sin(time * 5 + i + e.ph) * py * 0.2;
        ctx.fillStyle = '#868e96';
        ctx.beginPath();
        ctx.arc(bx, by, 5, 0, Math.PI * 2);
        ctx.fill();
        // 钳子大双臂
        ctx.beginPath();
        ctx.moveTo(bx - 8, by - 4);
        ctx.lineTo(bx - 3, by);
        ctx.moveTo(bx + 8, by - 4);
        ctx.lineTo(bx + 3, by);
        ctx.stroke();
      }
      break;
    }
  }

  ctx.restore();
}

window.drawKidCharacter = drawKidCharacter;
window.drawTokusatsuAirEntity = drawTokusatsuAirEntity;
window.rr = rr;
window.star = star;
