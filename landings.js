// ==========================================================================
// KAIJU FLY - 特摄片场见学收场结局与拍立得素描绘制系统
// ==========================================================================

const TOKUSATSU_LANDINGS = {
  anguirus: {
    name: '挂上安吉拉斯的背甲尖刺',
    head: '刺甲巨兽立大功！短裤遭遇重大危机',
    bonus: 80,
    face: '>///<',
    note: '安吉拉斯一动不敢动，小朋友满脸通红却还在傻笑。',
    missionName: '安吉拉斯'
  },
  canvas: {
    name: '撞穿手绘天空背景画布',
    head: '蓝天破了个大洞！天外来客卡在云端',
    bonus: 90,
    face: '^o^',
    note: '美工大叔站在梯子上端着油画笔，当场彻底石化。',
    missionName: '手绘背景布'
  },
  sand: {
    name: '倒栽葱扎进哥斯拉大脚印',
    head: '巨兽沙盘深度测量！只留两只小雨靴在倒蹬',
    bonus: 30,
    face: '@_@',
    note: '沙盘泥土表示：这位见学小勇士我们先收下了。',
    missionName: '怪兽沙盘'
  },
  tower: {
    name: '一屁股坐弯东京铁塔模型',
    head: '名场面复刻！红白铁塔折叠九十度绝景',
    bonus: 100,
    face: '✌_✌',
    note: '现场散落一地泡沫大楼碎片，小朋友坐在废墟上比耶。',
    missionName: '东京铁塔'
  },
  ultraman: {
    name: '落入偷喝奶茶的奥特战士怀里',
    head: '大危机！光之巨人后台喝奶茶被当场抓包',
    bonus: 110,
    face: 'O_O',
    note: '奥特战士嘴里还叼着吸管，单手下意识稳稳托住小孩。',
    missionName: '光之巨人'
  },
  water: {
    name: '砸进深海水槽掀起特摄巨浪',
    head: '突发人造海啸！特搜潜艇宣布全舰静默',
    bonus: 70,
    face: '~_~',
    note: '水花溅起三米高，小朋友头顶扣着一只塑料玩具潜艇。',
    missionName: '人工海槽'
  },
  dolly: {
    name: '平稳滑进摄影师移动轨道车',
    head: '神级客串！见学小副导演一发入魂最佳机位',
    bonus: 120,
    face: '★_★',
    note: '双手搭在胶片摄影机摇把上，全剧组起立鼓掌。',
    missionName: '摄影轨道车'
  },
  chair: {
    name: '砸翻总监督折叠椅与大喇叭',
    head: '突袭导演席！分镜画纸满天飞',
    bonus: 60,
    face: '#_#',
    note: '戴鸭舌帽的总监督大叔震惊地扶了扶老花眼镜。',
    missionName: '导演席'
  }
};

// 绘制静态特摄微缩地标与地面交互设施物件
function drawGroundTokusatsuObj(ctx, type, px, wy0, sx) {
  ctx.save();
  ctx.translate(sx != null ? sx : 0, wy0);

  switch (type) {
    // ---------------- 地面交互加速/弹跳设施 ----------------
    case 'trampoline': {
      // 哥斯拉橡胶皮套肚皮地面大弹簧床
      const bw = px * 0.9, bh = px * 0.45;
      // 底部金属弹簧底座
      ctx.strokeStyle = '#495057';
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) {
        const ox = i * (bw * 0.18);
        ctx.beginPath();
        ctx.moveTo(ox - 6, 0);
        ctx.lineTo(ox + 6, -bh * 0.28);
        ctx.lineTo(ox - 6, -bh * 0.45);
        ctx.stroke();
      }
      // 绿色橡胶肚腩垫
      ctx.fillStyle = '#2b4c3f';
      ctx.beginPath();
      ctx.ellipse(0, -bh * 0.45, bw * 0.48, bh * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#69db7c';
      ctx.beginPath();
      ctx.ellipse(0, -bh * 0.52, bw * 0.38, bh * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      // 红色弹射箭头标
      ctx.fillStyle = '#e03131';
      ctx.beginPath();
      ctx.moveTo(-10, -bh * 0.48);
      ctx.lineTo(0, -bh * 0.72);
      ctx.lineTo(10, -bh * 0.48);
      ctx.fill();
      break;
    }

    case 'building': {
      // 昭和特摄微缩泡沫纸板大厦
      const bw = px * 0.75, bh = px * 1.35;
      // 水泥灰大楼主体
      ctx.fillStyle = '#495057';
      ctx.fillRect(-bw * 0.5, -bh, bw, bh);
      ctx.fillStyle = '#343a40';
      ctx.fillRect(-bw * 0.5, -bh, bw * 0.1, bh); // 侧边立体阴影
      // 格子玻璃窗户 (亮黄/青蓝特摄光)
      const rows = 6, cols = 4;
      const ww = bw * 0.15, wh = bh * 0.09;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const wx = -bw * 0.42 + c * (bw * 0.23);
          const wy = -bh + 12 + r * (bh * 0.15);
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffd43b' : '#74c0fc';
          ctx.fillRect(wx, wy, ww, wh);
        }
      }
      // 楼顶红色避雷针与警示灯
      ctx.strokeStyle = '#e03131';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -bh);
      ctx.lineTo(0, -bh - 18);
      ctx.stroke();
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(0, -bh - 18, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'vent': {
      // 原子热核工业蒸汽喷管井口
      const vw = px * 0.65;
      // 钢铁井座
      ctx.fillStyle = '#212529';
      ctx.fillRect(-vw * 0.5, -16, vw, 16);
      ctx.fillStyle = '#ff922b';
      ctx.fillRect(-vw * 0.45, -14, vw * 0.9, 4); // 警示黄黑斑马线
      // 向上持续喷涌的特摄蒸汽与原子蓝焰
      ctx.fillStyle = 'rgba(77, 171, 247, 0.45)';
      ctx.beginPath();
      ctx.moveTo(-vw * 0.35, -16);
      ctx.lineTo(-vw * 0.55, -px * 0.85);
      ctx.lineTo(vw * 0.55, -px * 0.85);
      ctx.lineTo(vw * 0.35, -16);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.arc(0, -px * 0.45, vw * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'bento': {
      // 特摄剧组便当补给长桌与红白遮阳伞
      const tw = px * 0.75;
      // 剧组折叠桌与桌布
      ctx.fillStyle = '#ced4da';
      ctx.fillRect(-tw * 0.45, -18, tw * 0.9, 18);
      ctx.fillStyle = '#e03131';
      ctx.fillRect(-tw * 0.48, -20, tw * 0.96, 5); // 红桌布边
      // 桌上的剧组高级便当盒
      ctx.fillStyle = '#212529';
      ctx.fillRect(-tw * 0.3, -27, 16, 7);
      ctx.fillStyle = '#fcc419';
      ctx.fillRect(-tw * 0.28, -25, 12, 3);
      // 能量果汁罐与水壶
      ctx.fillStyle = '#22b8cf';
      ctx.fillRect(tw * 0.12, -31, 8, 11);
      ctx.fillStyle = '#fab005';
      ctx.fillRect(tw * 0.24, -28, 8, 8);
      // 红白相间摄影伞
      ctx.strokeStyle = '#495057';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.lineTo(0, -px * 0.65);
      ctx.stroke();
      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(0, -px * 0.65, tw * 0.38, Math.PI, 0);
      ctx.fill();
      break;
    }

    case 'dolly_rail': {
      // 贴地特摄滑轨冲刺板
      const rw = px * 0.85;
      ctx.fillStyle = '#fcc419';
      ctx.fillRect(-rw * 0.5, -10, rw, 10);
      ctx.fillStyle = '#212529';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const ax = -rw * 0.4 + i * (rw * 0.18);
        ctx.moveTo(ax - 5, -2);
        ctx.lineTo(ax + 5, -5);
        ctx.lineTo(ax - 5, -8);
        ctx.fill();
      }
      break;
    }

    // ---------------- 地面见学收场特摄道具 ----------------
    case 'anguirus': {
      // 四足刺甲怪兽安吉拉斯微缩模型
      ctx.fillStyle = '#63533e';
      ctx.beginPath();
      ctx.ellipse(0, -px * 0.32, px * 0.44, px * 0.24, 0, 0, Math.PI * 2);
      ctx.fill();
      // 头部与尖吻
      ctx.beginPath();
      ctx.ellipse(-px * 0.42, -px * 0.4, px * 0.22, px * 0.16, -0.2, 0, Math.PI * 2);
      ctx.fill();
      // 尖角与背甲尖刺
      ctx.fillStyle = '#d4c79b';
      for (let i = 0; i < 7; i++) {
        const sx = -px * 0.28 + i * px * 0.09;
        const sy = -px * 0.42 - Math.sin((i / 6) * Math.PI) * px * 0.18;
        ctx.beginPath();
        ctx.moveTo(sx - 3, -px * 0.35);
        ctx.lineTo(sx, sy - 8);
        ctx.lineTo(sx + 3, -px * 0.35);
        ctx.fill();
      }
      // 四足
      ctx.fillStyle = '#4a3d2e';
      ctx.fillRect(-px * 0.3, -px * 0.12, px * 0.12, px * 0.14);
      ctx.fillRect(px * 0.18, -px * 0.12, px * 0.12, px * 0.14);
      break;
    }

    case 'canvas': {
      // 巨幅手绘蓝天与富士山背景木架板
      ctx.strokeStyle = '#5a4632';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-px * 0.45, 0);
      ctx.lineTo(-px * 0.45, -px * 0.95);
      ctx.moveTo(px * 0.45, 0);
      ctx.lineTo(px * 0.45, -px * 0.95);
      ctx.stroke();

      // 画布蓝天
      ctx.fillStyle = '#74c0fc';
      ctx.fillRect(-px * 0.45, -px * 0.95, px * 0.9, px * 0.65);
      // 画布雪山 (富士山)
      ctx.fillStyle = '#1c7ed6';
      ctx.beginPath();
      ctx.moveTo(-px * 0.4, -px * 0.3);
      ctx.lineTo(0, -px * 0.82);
      ctx.lineTo(px * 0.4, -px * 0.3);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(-px * 0.16, -px * 0.6);
      ctx.lineTo(0, -px * 0.82);
      ctx.lineTo(px * 0.16, -px * 0.6);
      ctx.fill();

      // “特摄拍摄中”黄色胶带
      ctx.fillStyle = '#ffd43b';
      ctx.fillRect(-px * 0.45, -px * 0.36, px * 0.9, 12);
      ctx.fillStyle = '#1f313d';
      ctx.font = 'bold ' + Math.round(px * 0.09) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡ 拍摄区域 · 请勿靠近 ⚡', 0, -px * 0.28);
      break;
    }

    case 'sand': {
      // 哥斯拉巨大三趾脚印沙坑
      ctx.fillStyle = '#c2a265';
      ctx.beginPath();
      ctx.ellipse(0, -2, px * 0.36, px * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
      // 三个脚趾坑
      ctx.fillStyle = '#9c7e43';
      ctx.beginPath();
      ctx.ellipse(-px * 0.18, -px * 0.04, px * 0.1, px * 0.06, -0.4, 0, Math.PI * 2);
      ctx.ellipse(0, -px * 0.06, px * 0.12, px * 0.07, 0, 0, Math.PI * 2);
      ctx.ellipse(px * 0.18, -px * 0.04, px * 0.1, px * 0.06, 0.4, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'tower': {
      // 经典的微缩红白东京铁塔模型
      const th = px * 1.05;
      ctx.strokeStyle = '#e03131';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-px * 0.3, 0);
      ctx.lineTo(-px * 0.08, -th * 0.7);
      ctx.lineTo(0, -th);
      ctx.lineTo(px * 0.08, -th * 0.7);
      ctx.lineTo(px * 0.3, 0);
      ctx.stroke();

      // 白色中段横梁
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-px * 0.18, -th * 0.4);
      ctx.lineTo(px * 0.18, -th * 0.4);
      ctx.moveTo(-px * 0.1, -th * 0.65);
      ctx.lineTo(px * 0.1, -th * 0.65);
      ctx.stroke();
      break;
    }

    case 'ultraman': {
      // 坐在长椅上休息的奥特战士皮套演员
      ctx.fillStyle = '#868e96';
      ctx.fillRect(-px * 0.25, -px * 0.22, px * 0.5, px * 0.08); // 长椅

      // 银红身体
      ctx.fillStyle = '#ced4da';
      ctx.beginPath();
      ctx.ellipse(0, -px * 0.5, px * 0.18, px * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e03131';
      ctx.beginPath();
      ctx.arc(0, -px * 0.5, px * 0.12, 0, Math.PI);
      ctx.fill();
      // 蓝色胸口计时器
      ctx.fillStyle = '#339af0';
      ctx.beginPath();
      ctx.arc(0, -px * 0.52, 4, 0, Math.PI * 2);
      ctx.fill();
      // 鸭蛋眼奥特头盔
      ctx.fillStyle = '#e9ecef';
      ctx.beginPath();
      ctx.ellipse(0, -px * 0.85, px * 0.13, px * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffe066';
      ctx.beginPath();
      ctx.ellipse(-px * 0.05, -px * 0.85, 3, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(px * 0.05, -px * 0.85, 3, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'water': {
      // 拍海战的人工大水槽模型区
      ctx.fillStyle = '#495057';
      ctx.fillRect(-px * 0.42, -px * 0.28, px * 0.84, px * 0.28);
      // 水槽碧波
      ctx.fillStyle = '#22b8cf';
      ctx.fillRect(-px * 0.38, -px * 0.25, px * 0.76, px * 0.22);
      // 塑料小潜艇
      ctx.fillStyle = '#f59f00';
      ctx.beginPath();
      ctx.ellipse(0, -px * 0.18, px * 0.15, px * 0.06, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'dolly': {
      // 摄影移动轨道车 (Dolly)
      ctx.fillStyle = '#343a40';
      ctx.fillRect(-px * 0.35, -px * 0.2, px * 0.7, px * 0.08); // 平板车
      // 轨道轮
      ctx.fillStyle = '#adb5bd';
      ctx.beginPath();
      ctx.arc(-px * 0.22, -px * 0.05, 5, 0, Math.PI * 2);
      ctx.arc(px * 0.22, -px * 0.05, 5, 0, Math.PI * 2);
      ctx.fill();
      // 摄影机三脚架与 35mm 胶片机
      ctx.strokeStyle = '#495057';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, -px * 0.2);
      ctx.lineTo(0, -px * 0.55);
      ctx.stroke();
      ctx.fillStyle = '#212529';
      ctx.fillRect(-12, -px * 0.7, 24, 18);
      // 双胶片圆盒
      ctx.fillStyle = '#e9ecef';
      ctx.beginPath();
      ctx.arc(-6, -px * 0.74, 6, 0, Math.PI * 2);
      ctx.arc(6, -px * 0.74, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'chair': {
      // 总监督的帆布折叠椅与红色大喇叭
      ctx.strokeStyle = '#c92a2a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-px * 0.2, 0);
      ctx.lineTo(px * 0.15, -px * 0.4);
      ctx.moveTo(px * 0.2, 0);
      ctx.lineTo(-px * 0.15, -px * 0.4);
      ctx.stroke();
      // 黑色椅面写着 "DIRECTOR"
      ctx.fillStyle = '#212529';
      ctx.fillRect(-px * 0.22, -px * 0.45, px * 0.44, px * 0.12);
      // 红色扩音大喇叭
      ctx.fillStyle = '#e03131';
      ctx.beginPath();
      ctx.moveTo(px * 0.15, -px * 0.18);
      ctx.lineTo(px * 0.35, -px * 0.3);
      ctx.lineTo(px * 0.35, -px * 0.06);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }

  ctx.restore();
}

// 绘制见学纪念拍立得照片 (用于主游戏画面中的定格特写与报纸插图)
function drawTokusatsuLandingVignette(ctx, type, cx, cy, scale, t, Wd, Hd) {
  ctx.save();
  ctx.clearRect(0, 0, Wd, Hd);

  // 复古暖黄背景与片场木质地板
  ctx.fillStyle = '#f8f1de';
  ctx.fillRect(0, 0, Wd, Hd);
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // 片场地表
  ctx.fillStyle = '#d8c49d';
  ctx.fillRect(-260, 0, 520, Hd);
  ctx.strokeStyle = '#aa9369';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-260, 0);
  ctx.lineTo(260, 0);
  ctx.stroke();

  const wob = Math.sin(t * 8) * 0.08;

  // 1. 安吉拉斯尖刺划破短裤！(搞笑红心短裤演出)
  if (type === 'anguirus') {
    ctx.save();
    ctx.translate(-70, 0);
    drawGroundTokusatsuObj(ctx, 'anguirus', 140, 0);
    ctx.restore();

    // 小朋友倒栽葱倒挂在尖刺上，露出红心短裤
    ctx.save();
    ctx.translate(0, -60);
    ctx.rotate(-0.35 + wob);
    drawKidCharacter(ctx, 0, 0, 96, {
      arm: t * 6,
      tearPants: true,
      blushing: true
    });
    ctx.restore();

    // 羞嗒嗒文字
    ctx.fillStyle = '#c92a2a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('/// 凉飕飕！///', 70, -75);
  }

  // 2. 撞穿手绘天空富士山背景布
  else if (type === 'canvas') {
    ctx.save();
    ctx.translate(-80, 0);
    drawGroundTokusatsuObj(ctx, 'canvas', 220, 0);
    ctx.restore();

    // 画布中央撕裂洞口碎纸片
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = i % 2 ? '#74c0fc' : '#1c7ed6';
      ctx.save();
      ctx.translate(-80 + i * 16 - 48, -120 + ((i % 3) - 1) * 18);
      ctx.rotate(t * 2 + i);
      ctx.fillRect(-8, -6, 16, 12);
      ctx.restore();
    }

    // 小朋友整个人卡在洞里，头戴护目镜两手乱挥傻笑
    ctx.save();
    ctx.translate(-80, -110);
    drawKidCharacter(ctx, 0, 0, 96, {
      rot: 0.2 + wob,
      arm: t * 8,
      waving: true
    });
    ctx.restore();
    ctx.fillStyle = '#1c7ed6';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('哈哈哈哈！我飞进来啦！', 20, -120);
  }

  // 3. 倒栽葱插进哥斯拉脚印沙盘
  else if (type === 'sand') {
    ctx.save();
    drawGroundTokusatsuObj(ctx, 'sand', 180, 0);
    ctx.restore();

    // 两条穿着黄色小雨靴的腿朝天乱蹬
    drawKidCharacter(ctx, 0, 6, 100, {
      legsOnly: true,
      arm: t * 8
    });
    ctx.fillStyle = '#866336';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('...... 呼噜呼噜乱蹬中 ......', 40, 32);
  }

  // 4. 坐弯微缩红白东京铁塔
  else if (type === 'tower') {
    // 坐弯成 90 度的铁塔下半截
    ctx.strokeStyle = '#e03131';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-110, 0);
    ctx.lineTo(-75, -55);
    ctx.lineTo(20, -50); // 坐弯折断
    ctx.stroke();

    // 小朋友坐在折叠铁塔上比剪刀手
    ctx.save();
    ctx.translate(-40, -42);
    drawKidCharacter(ctx, 0, 0, 92, {
      rot: 0.15,
      arm: t * 3,
      peaceSign: true
    });
    ctx.restore();
    ctx.fillStyle = '#e03131';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('✌️ 打卡绝版折叠铁塔！✌️', 10, -90);
  }

  // 5. 掉进喝奶茶的奥特曼怀里
  else if (type === 'ultraman') {
    ctx.save();
    ctx.translate(-60, 0);
    drawGroundTokusatsuObj(ctx, 'ultraman', 160, 0);
    ctx.restore();

    // 奥特曼手里拿的一杯带吸管的珍珠奶茶
    ctx.fillStyle = '#ffe066';
    ctx.fillRect(-105, -92, 14, 20);
    ctx.strokeStyle = '#e03131';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-98, -92);
    ctx.lineTo(-94, -106); // 吸管
    ctx.stroke();

    // 小朋友稳稳被一只大银手托住
    ctx.save();
    ctx.translate(15, -80);
    drawKidCharacter(ctx, 0, 0, 90, {
      rot: -0.2 + wob,
      arm: t * 4,
      dizzyHappy: true
    });
    ctx.restore();
    ctx.fillStyle = '#2b8a3e';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('吸管奶茶被当场发现！(⊙_⊙)', -40, -135);
  }

  // 6. 砸穿海战拍摄大水池
  else if (type === 'water') {
    ctx.save();
    ctx.translate(-60, 0);
    drawGroundTokusatsuObj(ctx, 'water', 180, 0);
    ctx.restore();

    // 溅起的水花与气泡
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = 'rgba(51, 154, 240, 0.8)';
      ctx.beginPath();
      ctx.arc(-60 + i * 16, -20 - Math.sin(t * 5 + i) * 24, 5 + (i % 3) * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 小朋友浮出水面，头顶塑料微型潜艇
    ctx.save();
    ctx.translate(20, -28);
    drawKidCharacter(ctx, 0, 0, 90, {
      rot: -0.2 + wob,
      arm: t * 5,
      submarineOnHead: true
    });
    ctx.restore();
    ctx.fillStyle = '#15aabf';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('咕噜咕噜~ 潜艇上浮！', -20, -75);
  }

  // 7. 平稳滑进移动摄影轨道车
  else if (type === 'dolly') {
    ctx.save();
    ctx.translate(-70, 0);
    drawGroundTokusatsuObj(ctx, 'dolly', 180, 0);
    ctx.restore();

    // 小朋友帅气坐在摄影机旁边摇把手
    ctx.save();
    ctx.translate(10, -56);
    drawKidCharacter(ctx, 0, 0, 92, {
      rot: -0.1 + wob,
      arm: t * 3,
      directorMode: true
    });
    ctx.restore();
    ctx.fillStyle = '#f59f00';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('🎬 Action！这条保过！', 15, -110);
  }

  // 8. 砸翻总监督折叠椅与大喇叭
  else if (type === 'chair') {
    ctx.save();
    ctx.translate(-70, 0);
    drawGroundTokusatsuObj(ctx, 'chair', 160, 0);
    ctx.restore();

    // 满天飞舞的分镜画稿
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#adb5bd';
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.translate(-80 + i * 26, -60 - (i % 3) * 20);
      ctx.rotate(t * 2 + i);
      ctx.fillRect(-10, -8, 20, 16);
      ctx.strokeRect(-10, -8, 20, 16);
      ctx.restore();
    }

    // 小朋友砸在红色喇叭上吐舌头
    ctx.save();
    ctx.translate(15, -35);
    drawKidCharacter(ctx, 0, 0, 92, {
      rot: 0.3 + wob,
      arm: t * 5,
      dizzyHappy: true
    });
    ctx.restore();
    ctx.fillStyle = '#c92a2a';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('分镜本漫天飞！总监督大叔懵圈啦！', -35, -100);
  }

  ctx.restore();
}

window.TOKUSATSU_LANDINGS = TOKUSATSU_LANDINGS;
window.drawGroundTokusatsuObj = drawGroundTokusatsuObj;
window.drawTokusatsuLandingVignette = drawTokusatsuLandingVignette;
