const assert = require('assert/strict');
const { createGame } = require('./balance-check');
// Measure final world geometry independently of the placement predicate.
// Otherwise a broken predicate returning true would also make this test pass.
function footprint(e, ground) {
  const height=e.h*(!ground&&['rodan','mothra'].includes(e.type)?1.6:1);
  return {x:e.x,y:ground||['gillas','oilrig'].includes(e.type)?height/2:e.y,w:e.w,h:height};
}
let worlds = 0, pairs = 0;
for (let seed = 1; seed <= 24; seed++) {
  const { game } = createGame(seed, seed % 2 ? 0 : 3);
  game.startGame('distance', 0);
  for (const height of [0, 80, 190, 1010]) for (const x of [0, 700, 2200, 5000]) {
    game.S.camX = x; game.S.camY = height; game.ensureWorld();
    const all = game.S.air.map(e => [e, false]).concat(game.S.ground.map(e => [e, true]));
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const [a, grounded] = all[i], [b, otherGround] = all[j];
      const A=footprint(a,grounded),B=footprint(b,otherGround);
      const gapX=Math.abs(A.x-B.x)-(A.w+B.w)/2,gapY=Math.abs(A.y-B.y)-(A.h+B.h)/2;
      const same=a.type===b.type;
      assert.ok(Math.max(gapX/(same?20:9),gapY/(same?12:5))>=1-1e-9,`${seed}: ${a.type}/${b.type} overlap`);
      pairs++;
    }
    worlds++;
  }
}
const types = ['canvas','anguirus','sand','tower','ultraman','water','dolly','chair'];
for (const type of types) for (const character of ['boy','girl']) {
  const {game:g,progress}=createGame(3,3);g.startGame('distance',0);
  g.setCharacter(character);g.S.phase='flying';g.S.air=[];g.S.ground=[{type,x:40,w:12,h:10,hit:false}];
  // A single fast step crossing the entire prop still catches its near edge.
  g.S.j.x=100;g.S.j.y=5;g.S.dist=100;g.S.carried=1;
  assert.equal(g.checkLandingProps({x:0,y:5,dist:0}),true);
  assert.equal(g.S.phase,'landing');assert.equal(g.S.landingType,type);
  assert.equal(g.S.j.x,31);assert.equal(g.S.dist,type==='dolly'?46:31);
  assert.equal(g.S.carried,0);assert.ok(g.S.ground[0].hit);
  for(let i=0;i<120;i++)g.step(1/60);assert.equal(g.S.phase,'landing');
  for(let i=0;i<60;i++)g.step(1/60);assert.equal(g.S.phase,'result');
  const runs=progress.data.runs;g.showResult();assert.equal(progress.data.runs,runs);
}
{
  const {game:g}=createGame(1);g.startGame('distance',0);g.S.phase='flying';
  g.S.ground=[{type:'chair',x:70,w:12,h:10},{type:'canvas',x:40,w:12,h:10}];
  g.S.j.x=100;g.S.j.y=20;
  assert.equal(g.checkLandingProps({x:0,y:20,dist:0}),false,'Passing above a prop is safe');
  g.S.j.y=5;assert.ok(g.checkLandingProps({x:0,y:5,dist:0}));assert.equal(g.S.landingType,'canvas','Earliest contact wins, not array order');
  g.S.phase='flying';g.S.ground=[{type:'trampoline',x:40,w:12,h:10,isFacility:true}];
  g.S.j.x=100;assert.equal(g.checkLandingProps({x:0,y:5,dist:0}),false,'Boost facilities are not endings');
}
console.log(JSON.stringify({pass:true,worlds,pairs,endingContacts:16,highSpeed:true,nearMiss:true,earliestContact:true}));
