const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('assert/strict'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/');
 const all=Object.keys(JSON.parse(fs.readFileSync('art_prototypes/revision5/alpha-audit.json','utf8'))).filter(n=>!n.startsWith('portrait-'));
 const keys=all.map(n=>n.replace('.png','').replace(/^(gamera|cloud|oilrig)-frame-(\d)$/,'$1Frame$2').replace(/^prop-/,''));
 await page.waitForFunction(keys=>keys.every(k=>window.kaijuArt.get(k)),keys,{timeout:90000});
 await page.screenshot({path:'art_prototypes/revision5/qa-picker.png'});
 await page.locator('[data-character="boy"]').click();
 await page.evaluate(()=>window.__KAIJU__.S.frozen=true);
 assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'intro');
 // Inspect the actual draw calls: scene alone, left entrant, then right entrant.
 const positions=[];
 for(const t of [0,1.3,2.0,3.5]){
  positions.push(await page.evaluate(t=>{
   const g=window.__KAIJU__,c=document.getElementById('cv').getContext('2d'),draw=c.drawImage,log=[];
   g.S.introT=t;g.S.openingMonster='moth';
   c.drawImage=function(im,...a){if(im.src?.includes('opening-'))log.push({src:im.src.split('/').pop(),x:a[0],w:a[2]});return draw.call(this,im,...a);};
   g.render();c.drawImage=draw;return log;
  },t));
  await page.screenshot({path:`art_prototypes/revision5/qa-intro-${t}.png`});
 }
 const first=positions[0];assert.ok(first.find(x=>x.src==='opening-hero-boy.png').x+first.find(x=>x.src==='opening-hero-boy.png').w<0);
 assert.ok(first.find(x=>x.src==='opening-moth.png').x>1440);
 await page.evaluate(()=>{const g=window.__KAIJU__;g.S.introT=3.79;g.step(.02);});
 assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'menu');
 await page.screenshot({path:'art_prototypes/revision5/qa-menu.png'});
 const roster=await page.evaluate(()=>window.kaijuScene.monsters);
 for(const monster of roster){
  await page.evaluate(monster=>{const g=window.__KAIJU__;g.S.openingMonster=monster;g.render();},monster);
  await page.screenshot({path:`art_prototypes/revision5/qa-opening-${monster}.png`});
 }
 await page.locator('#changeCharacter').click();await page.locator('[data-character="girl"]').click();
 await page.locator('#skipOpening').click();assert.equal(await page.evaluate(()=>window.__KAIJU__.S.character),'girl');
 await page.screenshot({path:'art_prototypes/revision5/qa-menu-girl.png'});
 await page.locator('[data-mode="distance"]').click();await page.keyboard.press('Space');await page.keyboard.press('Space');
 await page.evaluate(()=>{const g=window.__KAIJU__;g.S.frozen=true;g.S.j.y=24;g.S.j.x=300;g.S.camX=300;g.S.camY=0;g.render();});
 await page.screenshot({path:'art_prototypes/revision5/qa-floor.png'});
 const drift=await page.evaluate(()=>{
  const g=window.__KAIJU__,s=g.S,c=document.getElementById('cv').getContext('2d'),draw=c.drawImage;
  s.camY=980;s.j.y=1005;g.ensureWorld();const snapshots=[];
  for(const t of [0,8]){s.t=t;const log=[];c.drawImage=function(im,...a){if(im.src?.includes('parallax-'))log.push({src:im.src,x:a[0]});return draw.call(this,im,...a);};g.render();snapshots.push(log);}
  c.drawImage=draw;return snapshots;
 });
 for(const layer of [0,1,2]){
  const a=drift[0].find(x=>x.src.includes('day-'+layer)),b=drift[1].find(x=>x.src.includes('day-'+layer));
  assert.ok(a&&b);assert.notEqual(a.x,b.x);
 }
 await page.screenshot({path:'art_prototypes/revision5/qa-high-altitude.png'});
 for(const stage of [1,2,3,4]){
  await page.evaluate(stage=>{const g=window.__KAIJU__;g.S.stage=stage;g.S.camY=0;g.S.j.y=24;g.render();},stage);
  await page.screenshot({path:`art_prototypes/revision5/qa-stage-${stage}.png`});
 }
 for(const character of ['boy','girl'])for(const type of ['canvas','anguirus','sand','tower','ultraman','water','dolly','chair']){
  for(const t of [0,.55,1.6]){
   await page.evaluate(({character,type,t})=>{const g=window.__KAIJU__;g.setCharacter(character);g.S.phase='flying';g.doLanding(type);g.S.landingT=t;g.S.flash=0;g.S.shake=0;g.S.frozen=true;g.render();},{character,type,t});
   await page.screenshot({path:`art_prototypes/revision5/qa-ending-${type}-${character}-${t}.png`});
  }
 }
 await page.evaluate(()=>{const g=window.__KAIJU__;g.S.landingT=2.89;g.step(.02);});
 assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'result');
 await page.screenshot({path:'art_prototypes/revision5/qa-result.png'});
 const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});
 mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto('http://127.0.0.1:8765/');
 await mobile.waitForFunction(()=>window.kaijuArt.get('opening-ghidorah'));
 await mobile.screenshot({path:'art_prototypes/revision5/qa-picker-mobile.png'});
 await mobile.locator('[data-character="girl"]').click();await mobile.locator('#skipOpening').click();
 await mobile.evaluate(()=>{const g=window.__KAIJU__;g.S.openingMonster='moth';g.render();});
 await mobile.screenshot({path:'art_prototypes/revision5/qa-menu-mobile.png'});
 assert.ok(await mobile.locator('[data-mode="distance"]').isVisible());
 await mobile.locator('summary').click();await mobile.screenshot({path:'art_prototypes/revision5/qa-menu-mobile-help.png'});
 await mobile.locator('#openWorkshop').click();assert.ok(await mobile.locator('#workshop').isVisible());
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({pass:true,assets:keys.length,openingVariants:roster.length,endingStates:48,highAltitudeDrift:3,mobile:true,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
