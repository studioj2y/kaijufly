// Trip photographs are separate from the upgrade save and never award currency.
(function () {
  'use strict';
  const KEY = 'kaijufly_album_v1', ROOT = 'art_prototypes/revision8/';
  const interactions = [
    ['cloud','引力射线','头发也跟着充满电了！'],
    ['rodan','拉顿顺风车','抓紧背包，向镜头挥挥手！'],
    ['mothra','摩斯拉的鳞粉','脸上都是闪闪发亮的纪念品。'],
    ['gamera','加美拉旋转飞行','蓝焰一转，帽子差点飞走！'],
    ['plane','特搜战机','摄影师，跟得上吗？'],
    ['gillas','吉拉斯相抱旋风','转了两圈，还记得看镜头！'],
    ['oilrig','哥斯拉仰天吐息','平成大明星，今天终于见到你！'],
    ['chili','骑士推进糖果','这颗糖的后劲有点大！'],
    ['can','奥特曼彩色计时器','胸前亮起来，体力回来了！'],
    ['birds','迷你巴尔坦','这张合影的手有点多。'],
    ['trampoline','橡胶肚腩蹦床','再弹高一点，就能入镜了！'],
    ['building','纸板都市','不好意思，借你们的屋顶一用！'],
    ['vent','蒸汽地井','热乎乎的片场限定发型。'],
    ['bento','剧组便当','脸上这一粒，留作纪念吧。'],
    ['dolly_rail','摄影滑轨','今天我也当了一回摄影师！']
  ];
  const endings = [
    ['canvas','撞破幕布','脑袋先向大家谢幕。'],['anguirus','安吉拉斯骑行','慢一点，再陪我走一段！'],
    ['sand','沙堆着陆','把整个片场的沙子带回家。'],['tower','铁塔挂留','这个观景位需要预约吗？'],
    ['ultraman','奥特曼接住','谢谢英雄，合影别忘了我！'],['water','水池落水','湿漉漉的快乐也值得收藏。'],
    ['dolly','摄影车收场','导演，这一条过了吗？'],['chair','导演椅收场','下一场，由我来喊开始！']
  ];
  const catalog = [];
  for (const [kind, rows] of [['interaction',interactions],['ending',endings]]) {
    for (const [type,title,note] of rows) for (const gender of ['boy','girl']) {
      catalog.push({id:kind+':'+type+':'+gender,kind,type,gender,title,note,
        src:ROOT+(kind==='interaction'?'photo-':'ending-photo-')+type+'-'+gender+'.jpg'});
    }
  }
  const valid = new Map(catalog.map(c=>[c.id,c]));
  let records = {}, saved = true, galleryOpen = false, focusBefore, detailId = null;
  try {
    const raw=JSON.parse(localStorage.getItem(KEY)||'{}');
    if (raw && raw.version===1 && raw.photos && typeof raw.photos==='object') {
      for (const [id,r] of Object.entries(raw.photos)) if(valid.has(id)&&r&&Number.isFinite(r.distance)&&r.distance>=0&&Number.isFinite(r.at))
        records[id]={distance:Math.floor(r.distance),at:r.at};
    }
  } catch (_) { /* A corrupt or unavailable save must not prevent a new visit. */ }
  const $=id=>document.getElementById(id);
  function persist() {
    try {localStorage.setItem(KEY,JSON.stringify({version:1,photos:records}));saved=true;}
    catch(_){saved=false;}
    return saved;
  }
  function collect(kind,type,gender,distance) {
    const id=kind+':'+type+':'+gender;
    if(!valid.has(id))return null;
    const fresh=!records[id];
    if(fresh)records[id]={distance:Math.max(0,Math.floor(Number(distance)||0)),at:Date.now()};
    persist(); // Retry a previously denied write on a later encounter.
    return {entry:valid.get(id),fresh,saved};
  }
  function imageState(img,src) {
    img.dataset.failed='false';
    img.onerror=()=>{img.dataset.failed='true';img.alt='照片暂时未能读取；收藏记录已保留，可稍后重试。';};
    img.src=src;
  }
  function begin(state,type) {
    if(state.testMode||state.phase!=='flying')return false;
    const capture=collect('interaction',type,state.character||'boy',state.dist);
    if(!capture)return false;
    state.holding=false;state.phase='photo';
    state.photo={type,time:0,wait:0,shutter:false,capture};
    const dialog=$('photoScene');
    $('photoTitle').textContent=capture.entry.title;
    $('photoNote').textContent=capture.entry.note;
    $('photoStatus').textContent='靠近一点，看镜头！';
    $('photoSaved').textContent=capture.saved?(capture.fresh?'新纪念照片 · 已收入见学画廊':'再次相遇 · 已收藏这张照片'):'本次已收藏，但浏览器未能保存；请勿关闭页面';
    imageState($('photoImage'),capture.entry.src);
    $('resumePhoto').disabled=true;
    dialog.dataset.shot='posing';dialog.style.setProperty('--photo-progress','0');
    dialog.showModal();
    return true;
  }
  function finish(state) {
    if(state.phase!=='photo'||!state.photo||state.photo.time<1.6)return false;
    $('photoScene').close();state.photo=null;state.holding=false;state.phase='flying';
    return true;
  }
  function tick(state,dt) {
    const p=state.photo;if(!p)return;
    // Wait briefly for a cold image, without advancing any flight clock.
    const img=$('photoImage');p.wait+=dt;
    if(!img.complete&&p.wait<1.2)return;
    p.time+=dt;
    const t=p.time,dialog=$('photoScene');
    dialog.style.setProperty('--photo-progress',String(Math.min(1,t/1.2)));
    dialog.dataset.shot=t<1.2?'posing':t<1.4?'flash':'printed';
    if(t<1.2)drawAction(state,t);
    if(t>=1.2&&!p.shutter){p.shutter=true;window.kaijuAudio?.play('pickup');}
    const status=t<1.2?'靠近一点，看镜头！':'咔嚓！见学纪念';
    if($('photoStatus').textContent!==status)$('photoStatus').textContent=status;
    $('resumePhoto').disabled=t<1.6;
    if(t>=3.6)finish(state);
  }
  function drawAction(state,t) {
    const ctx=$('photoAction').getContext('2d'),art=window.kaijuArt;
    ctx.clearRect(0,0,700,700);ctx.fillStyle='#8a9b9e';ctx.fillRect(0,0,700,700);
    const bg=art?.get('opening-background');if(bg)ctx.drawImage(bg,0,0,700,700);
    ctx.fillStyle='rgba(222,215,188,.18)';ctx.fillRect(0,0,700,700);
    const type=state.photo.type,name=type==='mothra'?'moth':type;
    const creature=art?.frame(name,t)||art?.get(name),hero=art?.frame(state.character||'boy',t,3);
    function sprite(im,x,y,w,rotation=0){if(!im)return;ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.drawImage(im,-w/2,-w*im.height/im.width/2,w,w*im.height/im.width);ctx.restore();}
    let hx=360,hy=320,angle=Math.sin(t*10)*.15,cx=350,cy=455,cw=500,hw=215;
    if(['rodan','mothra'].includes(type)){
      cy=280;cw=570;const grip=art.grip(name,t),ch=creature?cw*creature.height/creature.width:240;
      hx=cx+(grip.x-.5)*cw;hy=cy+(grip.y-.5)*ch+25;angle=.06*Math.sin(t*9);
    }else if(type==='gillas'){cx=350;cy=390;cw=470;hx=350+Math.cos(t*7)*215;hy=340+Math.sin(t*7)*100;angle=t*2;}
    else if(type==='oilrig'){cw=350;cy=390;hx=470;hy=400-t*130;angle=-.35;}
    else if(type==='cloud'){cy=220;cw=600;hy=450+Math.sin(t*18)*7;angle=Math.sin(t*20)*.17;}
    else if(type==='gamera'){cy=460;hy=330-Math.sin(t*3)*65;angle=-.22;}
    else if(type==='plane'){cy=350;hx=460;hy=440;angle=-.2;cx=230+t*95;}
    else if(['can','chili','birds','bento'].includes(type)){hw=300;hx=340;hy=330;cy=420;cw=type==='birds'?420:200;}
    else {hy=350-Math.sin(t*3)*100;angle=-.2;}
    if(type==='gillas'&&Math.sin(t*7)<0){sprite(hero,hx,hy,hw,angle);sprite(creature,cx,cy,cw);}
    else{sprite(creature,cx,cy,cw);sprite(hero,hx,hy,hw,angle);}
    if(['can','chili','bento'].includes(type))sprite(creature,410,380,140);
    // Viewfinder corners make the shift from moving encounter to still photo legible.
    ctx.strokeStyle='#f1e9d3';ctx.lineWidth=5;
    for(const [x,y,dx,dy] of [[26,26,1,1],[674,26,-1,1],[26,674,1,-1],[674,674,-1,-1]]){
      ctx.beginPath();ctx.moveTo(x+dx*55,y);ctx.lineTo(x,y);ctx.lineTo(x,y+dy*55);ctx.stroke();
    }
  }
  function count(){return Object.keys(records).length;}
  function refresh() {
    $('albumCount').textContent=count()+' / '+catalog.length+' 张 · 互动 30 张 / 结局 16 张';
    $('albumSave').textContent=saved?'照片保存在当前浏览器。每位主角各有一套纪念。':'浏览器未能保存，当前收藏仅在本次打开期间保留。';
    const kind=$('albumKind').value,gender=$('albumGender').value,grid=$('albumGrid');grid.replaceChildren();
    for(const entry of catalog.filter(c=>(kind==='all'||c.kind===kind)&&(gender==='all'||c.gender===gender))){
      const owned=!!records[entry.id],button=document.createElement('button');
      button.className='album-tile'+(owned?'':' locked');button.dataset.photo=entry.id;button.disabled=!owned;
      if(owned){const img=document.createElement('img');img.loading='lazy';img.alt=entry.title;imageState(img,entry.src);button.append(img);}
      else{const silhouette=document.createElement('span');silhouette.className='album-lock';silhouette.textContent='未留影';button.append(silhouette);}
      const title=document.createElement('b');title.textContent=entry.title;button.append(title);
      const caption=document.createElement('small');caption.textContent=(entry.gender==='boy'?'红帽男生':'风镜女生')+' · '+(owned?'查看纪念':entry.kind==='ending'?'完成这个结局解锁':'首次互动解锁');button.append(caption);
      grid.append(button);
    }
  }
  function showDetail(id) {
    const entry=valid.get(id);if(!entry||!records[id])return;
    detailId=id;$('albumBrowse').hidden=true;$('albumDetail').hidden=false;
    imageState($('albumImage'),entry.src);
    $('albumTitle').textContent=entry.title+' · '+(entry.gender==='boy'?'红帽男生':'风镜女生');
    $('albumNote').textContent=entry.note;
    $('albumMeta').textContent='首次留影于 '+records[id].distance+' 米 · '+new Date(records[id].at).toLocaleDateString('zh-CN');
    $('albumBack').focus();
  }
  function back() {
    const id=detailId;detailId=null;$('albumDetail').hidden=true;$('albumBrowse').hidden=false;
    const button=Array.from($('albumGrid').children).find(b=>b.dataset.photo===id);button?.focus();
  }
  function open(state) {
    if(!['menu','result'].includes(state.phase))return;
    state.holding=false;focusBefore=document.activeElement;galleryOpen=true;detailId=null;
    $('albumDetail').hidden=true;$('albumBrowse').hidden=false;refresh();$('albumDialog').showModal();
  }
  function close() {galleryOpen=false;detailId=null;$('albumDialog').close();focusBefore?.focus();}
  function bind(getState) {
    document.querySelectorAll('[data-open-album]').forEach(b=>b.addEventListener('click',()=>open(getState())));
    $('closeAlbum').addEventListener('click',close);$('albumBack').addEventListener('click',back);
    $('albumKind').addEventListener('change',refresh);$('albumGender').addEventListener('change',refresh);
    $('albumGrid').addEventListener('click',e=>{const b=e.target.closest('[data-photo]');if(b)showDetail(b.dataset.photo);});
    $('albumDialog').addEventListener('cancel',e=>{e.preventDefault();detailId?back():close();});
    $('photoScene').addEventListener('cancel',e=>{e.preventDefault();finish(getState());});
    $('resumePhoto').addEventListener('click',()=>finish(getState()));
  }
  window.kaijuAlbum={catalog,collect,begin,tick,finish,bind,open,close,count,isOpen:()=>galleryOpen,
    owns:id=>!!records[id],key:KEY};
})();
