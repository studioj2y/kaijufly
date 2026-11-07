const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let interruptedImage=false;
 await page.route('**/cloud-frame-6.png',route=>{
   if(!interruptedImage){interruptedImage=true;return route.abort();}
   return route.continue();
 });
 await page.goto('http://127.0.0.1:8765/?artpreview=1');
 await page.waitForFunction(()=>['boy','girl','moth','rodan','gillas','cloud','gamera','oilrig'].every(n=>Array.from({length:7},(_,i)=>window.kaijuArt.get(n+'Frame'+i)).every(Boolean))).catch(async error=>{
   console.error(await page.evaluate(()=>['boy','girl','moth','rodan','gillas','cloud','gamera','oilrig'].flatMap(n=>Array.from({length:7},(_,i)=>n+'Frame'+i)).filter(n=>!window.kaijuArt?.get(n))));
   throw error;
 });
 const frames=await page.evaluate(()=>{
   const names=['boy','girl','moth','rodan','gillas','cloud','gamera','oilrig'];
   return names.map(name=>({name,frames:new Set(Array.from({length:7},(_,i)=>window.kaijuArt.frame(name,(i+.05)/7).src)).size,png:new URL(window.kaijuArt.frame(name,0).src).pathname.endsWith('.png')}));
 });
 assert.ok(frames.every(n=>n.frames===7&&n.png));
 assert.ok(interruptedImage,'Exercise an interrupted image load');
 const starts=await page.evaluate(()=>{
   const g=window.__KAIJU__,s=g.S;s.frozen=false;s.phase='flying';s.holding=false;s.t=17.4;
   g.press();const first=s.flapStartedAt;s.t+=.1;g.press();const repeat=s.flapStartedAt;
   g.release();s.t+=.1;g.press();const second=s.flapStartedAt;s.frozen=true;
   return {first,repeat,second,distinct:window.kaijuArt.frame('pilot',0,5)!==window.kaijuArt.get('pilot')};
 });
 assert.equal(starts.first,17.4);assert.equal(starts.repeat,17.4);assert.ok(starts.second>starts.first);assert.ok(starts.distinct);
 for(const character of ['boy','girl'])for(const carrier of ['rodan','mothra']){
   for(let i=0;i<7;i++){
    const order=await page.evaluate(({character,carrier,i})=>{
      const g=window.__KAIJU__,s=g.S;window.kaijuArt.setCharacter(character);
      s.t=i/7+.005;s.carried=1;s.carryType=carrier;s.holding=false;s.air=[];s.ground=[];s.j.y=24;s.camY=0;
      const c=document.getElementById('cv').getContext('2d'),draw=c.drawImage,log=[];
      c.drawImage=function(image,...args){log.push(image.src||'');return draw.call(this,image,...args);};
      g.render();c.drawImage=draw;
      const name=carrier==='mothra'?'moth':carrier;
      return {carrier:log.findIndex(x=>x.includes(name+'-frame-')),pilot:log.findIndex(x=>x.includes(character+'-frame-3'))};
    },{character,carrier,i});
    assert.ok(order.carrier>=0&&order.pilot>order.carrier);
    if(i===0||i===4)await page.screenshot({path:`art_prototypes/revision4/qa-carry-${character}-${carrier}-${i}.png`});
   }
 }
 await page.goto('http://127.0.0.1:8765/?artpreview=1');await page.waitForTimeout(300);
 // View real game compositing, including every boy pose and the new effects.
 for(let i=0;i<7;i++){
   await page.evaluate(i=>{
    const g=window.__KAIJU__,s=g.S;window.kaijuArt.setCharacter('boy');
    s.t=(i+.01)/7;s.flapStartedAt=0;s.holding=true;s.carried=0;s.j.energy=50;s.j.vy=0;s.spin=0;
    s.j.y=22;s.j.x=310;s.camX=300;s.camY=0;s.ground=[];
    s.air=[{type:'gamera',x:333,y:32,w:17,h:11,ph:0,hit:false},{type:'cloud',x:360,y:37,w:22,h:10,ph:0,hit:false},{type:'gillas',x:338,y:9,w:16,h:18,ph:0,hit:false},{type:'oilrig',x:365,y:13,w:15,h:26,ph:0,hit:false}];
    g.render();
   },i);
   await page.screenshot({path:`art_prototypes/revision4/qa-scene-${i}.png`});
 }
 const high=await page.evaluate(()=>{
   const g=window.__KAIJU__,s=g.S;g.startGame('distance',0);s.frozen=true;s.phase='flying';
   s.j.y=1005;s.camY=980;s.j.x=0;s.camX=0;g.ensureWorld();
   const visible=s.air.find(e=>e.y>990&&e.y<1020&&e.x>20);s.camX=visible.x-25;s.j.x=s.camX;
   g.render();return {height:s.j.y,props:s.air.filter(e=>e.y>980&&e.y<1040).length};
 });
 assert.ok(high.props>0);await page.screenshot({path:'art_prototypes/revision4/qa-high-altitude.png'});
 // A missing asset must still render its fallback without a runtime error.
 await page.evaluate(()=>window.drawTokusatsuAirEntity(document.getElementById('cv').getContext('2d'),{type:'gamera',w:17,h:11,ph:0},300,300,12.5,1));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,frames,flapRestart:starts,carryFramesChecked:28,high,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
