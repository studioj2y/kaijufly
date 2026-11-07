const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[],report=[];
 try{
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/?revision=6');
  await page.waitForFunction(()=>['cannon','gameraFrame6','anguirusFrame6','decor-7','floor-texture-2','title-plate-1','ending-anguirus-girl-6','parallax-moon-2'].every(n=>window.kaijuArt?.get(n)),null,{timeout:60000}).catch(async e=>{
    console.error(await page.evaluate(()=>({ready:!!window.kaijuArt,missing:['cannon','gameraFrame6','anguirusFrame6','decor-7','floor-texture-2','title-plate-1','ending-anguirus-girl-6','parallax-moon-2'].filter(n=>!window.kaijuArt?.get(n))})));throw e;
  });
  await page.locator('[data-character="girl"]').click();await page.waitForFunction(()=>window.__KAIJU__.S.phase==='menu');
  await page.screenshot({path:`art_prototypes/revision6/qa-menu-${viewport.width}.png`});
  const clearTitle=await page.evaluate(()=>{
   const b=document.getElementById('soundBtn').getBoundingClientRect();
   return b.top>(innerWidth<600?94:138);
  });assert.ok(clearTitle,'Sound button never covers the enlarged title plaques');
  const bob=await page.evaluate(()=>new Promise(resolve=>{
   const ctx=document.getElementById('cv').getContext('2d'),draw=ctx.drawImage,ys=[];
   ctx.drawImage=function(im,...args){if(im.src?.includes('opening-hero-girl'))ys.push(args[1]);return draw.call(this,im,...args);};
   setTimeout(()=>{ctx.drawImage=draw;resolve(Math.max(...ys)-Math.min(...ys));},2500);
  }));assert.ok(bob>3&&bob<19,'Menu hero gently bobs');
  await page.locator('[data-mode="distance"]').click();
  assert.equal(await page.locator('#tip').textContent(),'人间大炮一级准备');
  await page.screenshot({path:`art_prototypes/revision6/qa-launch-${viewport.width}.png`});
  await page.keyboard.press('Space');assert.equal(await page.locator('#tip').textContent(),'人间大炮二级准备');
  await page.keyboard.press('Space');assert.equal(await page.locator('#tip').textContent(),'发射！');
  await page.waitForFunction(()=>window.__KAIJU__.S.launchNotice<=0);assert.match(await page.locator('#tip').textContent(),/挥动手臂/);
  await page.evaluate(()=>window.__KAIJU__.S.frozen=true);
  const floor=await page.evaluate(()=>{
    const values=Array.from({length:100},(_,i)=>window.kaijuScene.tileIndex(i,173));
    return {unique:new Set(values).size,adjacent:values.some((v,i)=>i&&v===values[i-1])};
  });assert.equal(floor.unique,8);assert.equal(floor.adjacent,false);
  for(const kind of ['gillas','gamera','anguirus','scenery']){
   await page.evaluate(kind=>{
    const g=window.__KAIJU__,s=g.S;g.startGame('distance',0);s.frozen=true;s.phase='flying';s.camX=300;s.camY=0;s.t=2;s.shake=0;s.flash=0;
    s.j.x=300;s.j.y=20;s.j.vx=45;s.j.vy=0;s.air=[];s.ground=[];
    if(kind==='gillas'){s.j.x=310;s.j.y=10;const e={type:'gillas',x:320,y:9,w:16,h:18,ph:0};s.air=[e];g.hit(e);for(let i=0;i<32;i++)g.step(1/60);s.shake=0;}
    if(kind==='gamera')s.air=Array.from({length:3},(_,i)=>({type:'gamera',x:310+i*23,y:20+i*10,w:19,h:9,ph:i*.3}));
    if(kind==='anguirus')s.ground=[{type:'anguirus',x:320,w:14,h:7,walkSpeed:2,walkT:.4}];
    if(kind==='scenery'){s.camX=1400;s.j.x=1400;s.j.y=40;}
    g.render();
   },kind);
   await page.waitForTimeout(350);
   await page.screenshot({path:`art_prototypes/revision6/qa-${kind}-${viewport.width}.png`});
  }
  // Riding presentation uses complete clothing in a dedicated female ending.
  await page.evaluate(()=>{const g=window.__KAIJU__;g.doLanding('anguirus');g.S.landingT=1.5;g.S.flash=0;g.render();});
  await page.waitForTimeout(350);
  await page.screenshot({path:`art_prototypes/revision6/qa-ride-${viewport.width}.png`});
  report.push({viewport,bob,launchStages:3,decor:floor});await context.close();
 }
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,report,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
