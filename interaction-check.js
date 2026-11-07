const assert=require('assert/strict');
const {createGame}=require('./balance-check');
const clear=g=>{g.startGame('distance',0);g.S.testMode=true;g.S.testEmptyWorld=true;g.S.phase='flying';g.S.air=[];g.S.ground=[];};
// Exactly two full turns, independent of frame duration. Held input must not
// drain stamina or turn this finite interaction into another infinite carry.
for(const dt of [1/60,1/30,.017]){
 const {game:g}=createGame(12);clear(g);
 Object.assign(g.S.j,{x:92,y:10,vx:60,vy:-5,energy:40});
 const tornado={type:'gillas',x:100,y:9,w:16,h:18,ph:0};g.S.air=[tornado];g.hit(tornado);
 const orbit=g.S.whirl;g.S.holding=true;let seconds=0,previous=g.S.j.x,maxStep=0;
 while(g.S.whirl&&seconds<3){g.step(dt);seconds+=dt;maxStep=Math.max(maxStep,Math.abs(g.S.j.x-previous));previous=g.S.j.x;}
 assert.equal(orbit.turns,2);assert.ok(seconds>=1.8&&seconds<1.8+dt+.00001);
 assert.equal(g.S.j.vy,38);assert.equal(g.S.j.energy,40);assert.ok(g.S.j.vx>0);
 assert.ok(maxStep<5,'Orbit release has no teleport');assert.equal(g.S.events.gillas,1);
 g.hit(tornado);assert.equal(g.S.whirl,null,'Used whirlwind does not catch the player again');
 let camera=g.S.camX;
 for(let i=0;i<12;i++){g.step(dt);assert.ok(Math.abs(g.S.camX-camera)<5,'Camera smoothly resumes flight after the orbit');camera=g.S.camX;}
 g.startGame('distance',0);assert.equal(g.S.whirl,null);
}
// A moving ground prop respects distinct/same-prop clearance and never backs up.
for(const blockerType of ['canvas','anguirus']){
 const {game:g}=createGame(2);clear(g);
 const walker={type:'anguirus',x:20,w:10,h:5,walkSpeed:2,walkT:0};
 const blocker={type:blockerType,x:60,w:10,h:5};g.S.ground=[walker,blocker];
 g.S.carried=100;g.S.carryType='rodan';g.S.carryY=100;
 for(let i=0;i<120;i++)g.step(1/60);
 assert.ok(Math.abs(walker.x-24)<1e-8,'2m/s walking speed');assert.ok(walker.walkT>1.9);
 for(let i=0;i<1800;i++)g.step(1/60);
 const gap=blockerType==='anguirus'?20:9;
 assert.ok(Math.abs(walker.x-(60-10-gap))<1e-8);assert.equal(walker.walking,false);
}
// Relative sweep catches a creature crossing a stationary visitor.
{
 const {game:g}=createGame(3);clear(g);g.setCharacter('girl');
 const walker={type:'anguirus',x:12,previousX:0,walkFrame:g.S.frame,w:4,h:5};g.S.ground=[walker];
 g.S.j.x=6;g.S.j.y=3;assert.ok(g.checkLandingProps({x:6,y:3,dist:6}));
 assert.equal(g.S.landingType,'anguirus');assert.equal(g.S.character,'girl');assert.ok(Math.abs(walker.x-1)<1e-8);
}
let count=0,total=0;
for(let seed=1;seed<=100;seed++){
 const {game:g}=createGame(seed);g.startGame('distance',0);
 for(const e of g.S.ground)if(!e.isFacility){total++;if(e.type==='anguirus')count++;}
}
assert.ok(count/total>.24&&count/total<.4,'Increased Anguirus frequency stays bounded');
console.log(JSON.stringify({pass:true,twoTurnOrbits:3,noTeleport:true,walkingClearance:2,movingContact:true,anguirusShare:count/total}));
