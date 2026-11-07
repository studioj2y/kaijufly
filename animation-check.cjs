const {chromium}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const assert=require('assert/strict');
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:720}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8765/?artpreview=1');
 await page.waitForFunction(()=>['boy','girl','moth','rodan','gillas','cloud'].every(n=>Array.from({length:7},(_,i)=>window.kaijuArt.get(n+'Frame'+i)).every(Boolean)));
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
    if(i===0||i===4)await page.screenshot({path:`art_prototypes/revision3/qa-carry-${character}-${carrier}-${i}.png`});
   }
 }
 await page.goto('http://127.0.0.1:8765/?artpreview=3');await page.waitForTimeout(300);
 await page.screenshot({path:'art_prototypes/revision3/qa-giras.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,flapRestart:starts,carryFramesChecked:28,errors}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
