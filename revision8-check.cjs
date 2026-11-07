const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[],report={};
 try{
 const context=await browser.newContext({viewport:{width:1280,height:800}}),page=await context.newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/?revision=8');
 await page.waitForFunction(()=>['oilrigFrame6','gameraFrame6','anguirusFrame6','canFrame6','ending-anguirus-girl-6'].every(n=>window.kaijuArt?.get(n)),null,{timeout:60000});
 await page.locator('[data-character="boy"]').click();await page.waitForFunction(()=>window.__KAIJU__.S.phase==='menu');
 await page.locator('#menu [data-open-album]').click();
 assert.equal(await page.locator('.album-tile').count(),46);assert.equal(await page.locator('.album-tile:not(:disabled)').count(),0);
 await page.keyboard.press('Escape');assert.equal(await page.locator('#albumDialog').isVisible(),false);
 await page.evaluate(()=>{const g=window.__KAIJU__;g.startGame('distance',0);g.S.frozen=true;g.S.phase='flying';g.S.j.x=100;g.S.j.y=60;g.S.dist=100;g.hit({type:'cloud',x:100,y:60});});
 await page.locator('#photoImage').waitFor();await page.waitForFunction(()=>document.getElementById('photoImage').naturalWidth>0);
 const snapshot=()=>page.evaluate(()=>{const s=window.__KAIJU__.S;return JSON.stringify([s.j,s.t,s.frame,s.dist,s.bonus,s.comboTimer,s.camX,s.camY,s.carried,s.whirl,s.particles,s.stun,s.skeleton,s.flash]);});
 const before=await snapshot();
 await page.evaluate(()=>{for(let i=0;i<35;i++)window.__KAIJU__.step(1/60);});
 assert.equal(await snapshot(),before,'All physics, effect and score clocks remain frozen while photographing');
 await page.screenshot({path:'art_prototypes/revision8/qa-action.png'});
 await page.evaluate(()=>{for(let i=0;i<85;i++)window.__KAIJU__.step(1/60);});
 assert.equal(await snapshot(),before);
 await page.screenshot({path:'art_prototypes/revision8/qa-photo.png'});
 await page.locator('#resumePhoto').click();assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'flying');
 await page.evaluate(()=>window.__KAIJU__.hit({type:'cloud',x:100,y:60}));
 assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'flying','Repeated same-type contact in one run never reopens photo');
 assert.equal(await page.evaluate(()=>window.kaijuAlbum.count()),1);
 await page.evaluate(()=>{const g=window.__KAIJU__;g.startGame('distance',0);g.S.frozen=true;g.S.phase='flying';g.hit({type:'cloud',x:100,y:60});});
 assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'photo','New run permits a new photo with an old acquaintance');
 assert.equal(await page.evaluate(()=>window.kaijuAlbum.count()),1,'No duplicate permanent collectible');
 await page.evaluate(()=>{for(let i=0;i<300;i++)window.__KAIJU__.step(1/60);window.__KAIJU__.S.frozen=true;});
 assert.equal(await page.locator('#photoScene').isVisible(),false);
 // Every interaction, both genders, including real ground-facility collision paths.
 for(const gender of ['boy','girl']){
  for(const type of ['cloud','rodan','mothra','gamera','plane','gillas','oilrig','chili','can','birds','trampoline','building','vent','bento','dolly_rail']){
   await page.evaluate(({gender,type})=>{
    const g=window.__KAIJU__,s=g.S;g.startGame('distance',0);g.setCharacter(gender);s.frozen=true;s.phase='flying';s.air=[];s.j.x=100;s.j.y=60;s.j.vx=40;s.j.vy=0;s.dist=100;
    if(['trampoline','building','vent','bento','dolly_rail'].includes(type)){s.j.y=2;s.ground=[{type,x:100,w:18,h:5,isFacility:true}];g.step(1/60);}
    else g.hit({type,x:100,y:60,w:16,h:18,ph:0});
   },{gender,type});
   assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'photo',gender+':'+type);
   await page.waitForFunction(()=>document.getElementById('photoImage').complete&&document.getElementById('photoImage').naturalWidth>0);
   await page.evaluate(()=>{for(let i=0;i<125;i++)window.__KAIJU__.step(1/60);});
   await page.locator('#resumePhoto').click();
   assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'flying');
  }
 }
 assert.equal(await page.evaluate(()=>window.kaijuAlbum.count()),30);
 for(const gender of ['boy','girl'])for(const type of ['canvas','anguirus','sand','tower','ultraman','water','dolly','chair']){
  await page.evaluate(({gender,type})=>{const g=window.__KAIJU__;g.setCharacter(gender);g.S.landingType=type;g.S.dist=450;g.showResult();},{gender,type});
 }
 assert.equal(await page.evaluate(()=>window.kaijuAlbum.count()),46);
 const points=await page.evaluate(()=>window.kaijuProgress.data.points);await page.evaluate(()=>window.__KAIJU__.showResult());
 assert.equal(await page.evaluate(()=>window.kaijuProgress.data.points),points,'Photo/ending duplicates do not grant extra upgrade points');
 await page.locator('#result [data-open-album]').click();
 assert.equal(await page.locator('.album-tile:not(:disabled)').count(),46);
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('#albumGrid img')).slice(0,8).every(im=>im.complete&&im.naturalWidth>0));
 assert.ok(await page.evaluate(()=>{const r=document.getElementById('albumDialog').getBoundingClientRect();return Math.abs(r.left-(innerWidth-r.width)/2)<2;}),'Gallery is centered');
 await page.screenshot({path:'art_prototypes/revision8/qa-gallery.png'});
 await page.locator('#albumKind').selectOption('interaction');await page.locator('#albumGender').selectOption('girl');
 assert.equal(await page.locator('.album-tile').count(),15);
 await page.locator('[data-photo="interaction:can:girl"]').click();
 await page.waitForFunction(()=>document.getElementById('albumImage').complete&&document.getElementById('albumImage').naturalWidth>0);
 await page.screenshot({path:'art_prototypes/revision8/qa-detail.png'});
 await page.keyboard.press('Escape');assert.equal(await page.locator('#albumDetail').isVisible(),false);
 await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>window.__KAIJU__.S.phase),'result');
 await page.reload();await page.waitForFunction(()=>!!window.kaijuAlbum);assert.equal(await page.evaluate(()=>window.kaijuAlbum.count()),46);
 report.pauseFreeze=true;report.firstContactPerRun=true;report.persistentCollectibles=46;
 const mobile=await context.newPage();await mobile.setViewportSize({width:390,height:844});await mobile.goto('http://127.0.0.1:8765/?revision=8');
 mobile.on('pageerror',e=>errors.push(e.message));
 await mobile.locator('[data-character="girl"]').click();await mobile.waitForFunction(()=>window.__KAIJU__.S.phase==='menu');
 await mobile.locator('#menu [data-open-album]').click();
 await mobile.waitForFunction(()=>Array.from(document.querySelectorAll('#albumGrid img')).slice(0,4).every(im=>im.complete&&im.naturalWidth>0));
 assert.ok(await mobile.evaluate(()=>{const e=document.getElementById('albumDialog');return e.scrollWidth<=e.clientWidth+1;}),'Mobile gallery has no horizontal overflow');
 await mobile.screenshot({path:'art_prototypes/revision8/qa-mobile-gallery.png'});
 await mobile.locator('#closeAlbum').click();
 await mobile.evaluate(()=>{const g=window.__KAIJU__;g.startGame('distance',0);g.S.frozen=true;g.S.phase='flying';g.hit({type:'can',x:0,y:10});});
 await mobile.waitForFunction(()=>document.getElementById('photoImage').naturalWidth>0);
 await mobile.evaluate(()=>{for(let i=0;i<125;i++)window.__KAIJU__.step(1/60);});
 await mobile.screenshot({path:'art_prototypes/revision8/qa-mobile-photo.png'});
 assert.ok(await mobile.evaluate(()=>{const e=document.getElementById('photoScene');return e.scrollWidth<=e.clientWidth+1;}),'Mobile photo is fully contained');
 assert.ok(await mobile.locator('#resumePhoto').isEnabled());
 // A failed photo download must still resume, and preserve the collectible.
 await mobile.locator('#resumePhoto').click();await mobile.route('**/photo-rodan-girl.jpg',route=>route.abort());
 await mobile.evaluate(()=>window.__KAIJU__.hit({type:'rodan',x:0,y:10}));
 await mobile.waitForTimeout(300);
 await mobile.evaluate(()=>{for(let i=0;i<300;i++)window.__KAIJU__.step(1/60);});
 assert.equal(await mobile.locator('#photoScene').isVisible(),false);
 assert.deepEqual(errors,[]);report.browserErrors=errors;report.mobile=true;report.failedImageResumes=true;
 console.log(JSON.stringify({pass:true,...report}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
