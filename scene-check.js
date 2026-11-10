const assert = require('assert/strict');
const fs = require('fs');
const vm = require('vm');
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
// Requested gameplay-size changes: ground boosters are 50% larger; rooted standing Godzilla is 20% larger.
{
  const {game:g}=createGame(5);
  const expected={trampoline:[22.5,9],building:[21,24],vent:[18,10.5],bento:[16.5,10.5],dolly_rail:[24,9]};
  for(const type of g.GROUND_FACILITY_TYPES){
    const item=g.makeGround(type,100,true),[w,h]=expected[type];
    assert.ok(Math.abs(item.w-w)<1e-9,`${type} width is scaled 50%`);
    assert.ok(Math.abs(item.h-h)<1e-9,`${type} height is scaled 50%`);
    assert.equal(item.isFacility,true);
  }
  assert.deepEqual(Array.from(g.entitySize('oilrig')),[30,52.8]);
  const unchanged=g.makeGround('chair',100,false);
  assert.ok(Math.abs(unchanged.w-8)<.03 && unchanged.h<8 && unchanged.h>7.9,'non-facility ground endings keep their original size');
}
// Scene layers may drift only once flight starts, not while the launch is being aimed/charged.
{
  const window={},context={window};
  vm.runInNewContext(fs.readFileSync(__dirname+'/scene_art.js','utf8'),context,{filename:'scene_art.js'});
  for(const phase of ['aim','power']){
    const a={phase,t:0,camX:0},b={...a,t:9};
    assert.equal(window.kaijuScene.parallaxOffset(a,2,12.5),window.kaijuScene.parallaxOffset(b,2,12.5),`${phase} foreground remains still`);
  }
  const a={phase:'flying',t:0,camX:0},b={...a,t:1};
  assert.ok(window.kaijuScene.parallaxOffset(b,2,12.5)>window.kaijuScene.parallaxOffset(a,2,12.5),'foreground resumes drift in flight');
}
console.log(JSON.stringify({pass:true,worlds,pairs,endingContacts:16,highSpeed:true,nearMiss:true,earliestContact:true,facilityScaling:true,oilrigScaling:true,prelaunchScroll:false,flightScroll:true}));
