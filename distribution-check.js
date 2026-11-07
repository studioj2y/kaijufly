const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/air_distribution.js','utf8'),ctx);
const {sample,bands,rowForHeight,rowBounds}=ctx.window.kaijuAirDistribution;
let seed=124;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
for(const [height,row] of [[0,0],[29.99,0],[30,1],[79.99,1],[80,2],[130,3],[180,4],[230,5],[1030,21]]) assert.equal(rowForHeight(height),row);
const preferred=['mothra','plane','rodan','cloud','cloud','cloud'];
const rows=[1,2,3,4,10,10000];
const summary=rows.map((row,i)=>{
  const counts={},[min,max]=rowBounds(row);
  for(let n=0;n<20000;n++){
    const e=sample(random,row);
    assert.ok(e.y>=min&&e.y<max);
    assert.ok(!['gillas','oilrig','balloon'].includes(e.type));
    counts[e.type]=(counts[e.type]||0)+1;
  }
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
  assert.equal(entries[0][0],preferred[i]);
  assert.equal(entries.length,8,'All airborne types remain possible at every height');
  const total=entries.reduce((s,e)=>s+e[1],0);
  return {height:[min,max],preferred:preferred[i],share:Math.round(counts[preferred[i]]/total*100)+'%',total};
});
// Exercise the actual world generator, including vertical movement in chunks
// that were already built while the player was close to the ground.
const {createGame,run}=require('./balance-check');
const {game}=createGame(123);
game.startGame('distance',0);
const s=game.S,initialGenX=s.genX;
const heights=[55,105,155,205,305,1005,10005];
const actual=heights.map(height=>{
  s.camY=height-25;s.j.y=height;game.ensureWorld();
  assert.equal(s.genX,initialGenX);
  const row=rowForHeight(height),[min,max]=rowBounds(row);
  const inRow=s.air.filter(e=>e.y>=min&&e.y<max);
  assert.ok(inRow.length>0,'High-altitude encounters exist in already generated horizontal chunks');
  const count=s.air.length;game.ensureWorld();assert.equal(s.air.length,count,'Do not duplicate a generated row');
  inRow[0].hit=true;game.ensureWorld();assert.equal(inRow[0].hit,true);
  return {height,encounters:inRow.length};
});
s.camY=30;game.ensureWorld();
assert.ok(s.air.filter(e=>e.y>=30&&e.y<80).some(e=>e.hit),'Revisiting a row preserves consumed props');
const density={low:0,first:0};
for(let seed=1;seed<=120;seed++){
 const {game:g}=createGame(seed);g.startGame('distance',0);
 density.low+=g.S.air.filter(e=>!['oilrig','gillas'].includes(e.type)&&e.y>=14&&e.y<30).length;
 density.first+=g.S.air.filter(e=>e.y>=30&&e.y<80).length;
}
assert.ok(density.low<density.first*.35,'Under 30 m must be sparse');
for(let x=160;x<100000;x+=160){s.camX=x;s.camY=1000+Math.sin(x/1000)*250;game.ensureWorld();}
assert.ok(s.air.length<250&&s.airCells.size<150,`World retained ${s.air.length} sprites / ${s.airCells.size} cells`);
const unattended=Array.from({length:24},(_,i)=>run(i+1,'none'));
assert.ok(unattended.every(r=>r.phase==='result'),'Unattended flights must still end');
const highCloud=s.air.find(e=>e.type==='cloud');assert.ok(highCloud);
s.phase='flying';s.j.energy=0;game.hit(highCloud);assert.ok(s.j.energy>0,'High-altitude props must be interactive');
const gamera={type:'gamera',x:s.j.x,y:s.j.y,hit:false};s.j.vy=-20;game.hit(gamera);assert.equal(s.j.vy,33);assert.equal(s.events.gamera,1);
console.log(JSON.stringify({pass:true,samples:120000,summary,actual,density,retained:{sprites:s.air.length,cells:s.airCells.size},unattended:{runs:unattended.length,maxSeconds:Math.max(...unattended.map(r=>r.seconds)),maxDistance:Math.max(...unattended.map(r=>r.distance))}},null,2));
