const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const results=[],errors=[];
 for(const reducedMotion of ['reduce','no-preference']){
  const context=await browser.newContext({reducedMotion,viewport:{width:1280,height:800}});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?revision=5.1');
  await page.waitForFunction(()=>window.kaijuScene.monsters.every(n=>window.kaijuArt.get('opening-'+n))&&window.kaijuArt.get('opening-hero-boy')&&window.kaijuArt.get('oilrigFrame6'));
  await page.screenshot({path:`art_prototypes/revision5/qa-natural-selection-${reducedMotion}.png`});
  // Observe real RAF-driven playback after a normal click. Do not assign phase,
  // frozen, or introT: the former preview hid the reduced-motion regression.
  await page.evaluate(()=>{
   const c=document.getElementById('cv').getContext('2d'),draw=c.drawImage;
   window.entrance={};c.drawImage=function(im,...a){
    const s=window.__KAIJU__.S;
    if(im.src?.includes('opening-hero-boy'))window.entrance.hero={x:a[0],w:a[2]};
    if(im.src?.includes('opening-'+s.openingMonster+'.png'))window.entrance.monster={x:a[0],w:a[2]};
    return draw.call(this,im,...a);
   };
  });
  await page.locator('[data-character="boy"]').click();
  assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'intro');
  const snapshots=[];
  for(const time of [.3,1.3,2.0,2.8]){
   await page.waitForFunction(time=>window.__KAIJU__.S.introT>=time,time);
   const state=await page.evaluate(()=>({t:window.__KAIJU__.S.introT,phase:window.__KAIJU__.S.phase,...window.entrance}));
   snapshots.push(state);assert.equal(state.phase,'intro');
   await page.screenshot({path:`art_prototypes/revision5/qa-live-intro-${reducedMotion}-${time}.png`});
  }
  assert.ok(snapshots[0].hero.x+snapshots[0].hero.w<0&&snapshots[0].monster.x>1280,'Scene appears alone');
  assert.ok(snapshots[1].hero.x+snapshots[1].hero.w>0&&snapshots[1].monster.x>1280,'Only hero enters in stage two');
  assert.ok(snapshots[2].monster.x>1280,'Monster waits until hero has settled');
  assert.ok(snapshots[3].monster.x<1280,'Monster enters in stage three');
  assert.ok(Math.abs(snapshots[2].hero.x-snapshots[3].hero.x)<.01,'Hero remains still during monster entrance');
  await page.waitForFunction(()=>window.__KAIJU__.S.phase==='menu');
  assert.ok(await page.evaluate(()=>window.__KAIJU__.S.introT>=3.8));
  await page.locator('#changeCharacter').click();await page.locator('[data-character="girl"]').click();
  assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'intro');
  await page.locator('#skipOpening').click();assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'menu');
  results.push({reducedMotion,sequence:snapshots.map(s=>({time:+s.t.toFixed(2),heroX:Math.round(s.hero.x),monsterX:Math.round(s.monster.x)})),manualSkip:true});
  if(reducedMotion==='no-preference'){
   await page.waitForFunction(()=>Array.from({length:7},(_,i)=>window.kaijuArt.get('oilrigFrame'+i)).every(Boolean));
   const feet=[];
   for(let frame=0;frame<7;frame++){
    feet.push(await page.evaluate(frame=>{
     const g=window.__KAIJU__,s=g.S;g.startGame('distance',0);s.frozen=true;s.phase='flying';s.t=(frame+.05)/7;
     s.camX=300;s.camY=0;s.j.x=300;s.j.y=30;s.ground=[];s.air=[{type:'oilrig',x:340,y:22,w:25,h:44,ph:0}];s.shake=0;s.flash=0;
     const im=window.kaijuArt.get('oilrigFrame'+frame),scratch=document.createElement('canvas');scratch.width=im.width;scratch.height=im.height;
     const sc=scratch.getContext('2d');sc.drawImage(im,0,0);const rgba=sc.getImageData(0,0,im.width,im.height).data;
     let bottom=0;for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(rgba[(y*im.width+x)*4+3]>150)bottom=y+1;
     const c=document.getElementById('cv').getContext('2d'),draw=c.drawImage;let footY;
     c.drawImage=function(image,...a){if(image===im){const m=this.getTransform();footY=m.d*(a[1]+a[3]*bottom/im.height)+m.f;}return draw.call(this,image,...a);};
     g.render();c.drawImage=draw;return {frame,footY,groundY:innerHeight*.8};
    },frame));
    await page.screenshot({path:`art_prototypes/revision5/qa-grounded-godzilla-${frame}.png`});
   }
   assert.ok(feet.every(f=>Math.abs(f.footY-f.groundY-3)<.01),'All seven opaque soles sit 3 px into the floor');
   results.push({feet});
  }
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,results,errors}));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
