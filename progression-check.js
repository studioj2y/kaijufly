const assert = require('assert/strict');
const fs = require('fs'), vm = require('vm');
const { createGame, run } = require('./balance-check');
const storage = {};
const ctx = { window: {}, localStorage: { getItem: k => storage[k], setItem: (k, v) => { storage[k] = v; } } };
const code = fs.readFileSync(__dirname + '/progression.js', 'utf8');
vm.runInNewContext(code, ctx);
let p = ctx.window.kaijuProgress;
assert.equal(p.buy('skid'), false);
p.award(3500, 8, false);
assert.equal(p.buy('skid'), true);
assert.equal(p.equip('skid', 2), false);
assert.equal(p.equip('skid', 0), true);
vm.runInNewContext(code, ctx);
p = ctx.window.kaijuProgress;
assert.equal(p.data.owned.skid, 1);
assert.equal(p.snapshot().skid, 0);
assert.equal(p.data.runs, 1);
for (const rank of [0, 3]) {
  const { game: g, progress } = createGame(5, rank);
  g.startGame('distance', 0);
  assert.equal(g.S.j.energy, 65 + 15 * rank);
  progress.equip('stamina', 0);
  assert.equal(g.S.loadout.stamina, rank); // Mid-flight snapshots cannot change.
  g.S.phase = 'flying'; g.S.j.energy = 0;
  g.hit({type:'mothra', x:0, y:30, hit:false});
  assert.equal(g.S.j.energy, 20 + 15 * rank);
  g.S.carried = 0.001; g.S.carryType = 'rodan'; g.S.carryY = 30;
  g.S.air = []; g.S.ground = []; g.S.genX = 1e6;
  g.step(1/60);
  assert.equal(g.S.j.vy, rank ? 28 : 4);
  for (const [x, stage] of [[1790,1],[1810,2],[3760,3],[6310,4]]) {
    g.S.j.x=x; g.S.j.y=40; g.S.phase='flying'; g.step(1/60);
    assert.equal(g.S.stage, stage);
  }
  g.S.phase='flying'; g.S.j.y=0; g.S.j.vy=-20; g.S.j.vx=40; g.S.skids=0;
  g.step(1/60);
  assert.equal(g.S.phase, rank ? 'flying' : 'landing');
  g.S.dist=400; g.showResult(); const count=progress.data.runs;
  g.showResult(); assert.equal(progress.data.runs, count);
}
const summary=[];
for (const rank of [0,3]) for (const strategy of ['none','hold','low-altitude']) {
  const samples=Array.from({length:12},(_,i)=>run(i+1,strategy,rank));
  const sorted=samples.map(s=>s.distance).sort((a,b)=>a-b);
  summary.push({rank,strategy,finished:samples.filter(s=>s.phase==='result').length,medianDistance:Math.round((sorted[5]+sorted[6])/2),maxDistance:sorted[11],maxSeconds:Math.max(...samples.map(s=>s.seconds)),maxEntities:Math.max(...samples.map(s=>s.air+s.ground))});
  if(strategy==='none') assert.equal(samples.filter(s=>s.phase==='result').length,12);
}
console.log(JSON.stringify({pass:true,summary},null,2));
