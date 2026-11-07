const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/air_distribution.js','utf8'),ctx);
const {sample,bands}=ctx.window.kaijuAirDistribution;
let seed=124;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const counts=bands.map(()=>({}));
for(let i=0;i<50000;i++){
  const e=sample(random);
  assert.ok(e.y>=9&&e.y<115);
  const band=e.y<32?0:e.y<55?1:e.y<80?2:3;
  counts[band][e.type]=(counts[band][e.type]||0)+1;
}
const preferred=['mothra','plane','rodan','cloud'];
const summary=counts.map((row,i)=>{
  const entries=Object.entries(row).sort((a,b)=>b[1]-a[1]);
  assert.equal(entries[0][0],preferred[i]);
  const total=entries.reduce((s,e)=>s+e[1],0);
  return {height:[bands[i].min,bands[i].max],preferred:preferred[i],share:Math.round(row[preferred[i]]/total*100)+'%',total};
});
console.log(JSON.stringify({pass:true,samples:50000,summary},null,2));
