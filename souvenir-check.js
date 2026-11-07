const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const source=fs.readFileSync(__dirname+'/souvenirs.js','utf8');
function album(raw,blocked=false){
 const store={raw};const window={};
 vm.runInNewContext(source,{window,Date,localStorage:{getItem(){return store.raw;},setItem(k,v){if(blocked)throw Error('denied');store.raw=v;}}});
 return {a:window.kaijuAlbum,store};
}
for(const raw of [null,'broken','null','[]','{"version":9,"photos":{}}'])assert.equal(album(raw).a.count(),0);
const {a,store}=album(null);
assert.equal(a.catalog.length,46);assert.equal(new Set(a.catalog.map(e=>e.id)).size,46);
assert.equal(a.collect('interaction','unknown','boy',1),null);
assert.equal(a.collect('interaction','cloud','boy',100).fresh,true);
assert.equal(a.collect('interaction','cloud','boy',999).fresh,false);
assert.equal(a.collect('interaction','cloud','girl',200).fresh,true);
assert.equal(a.count(),2);assert.equal(JSON.parse(store.raw).photos['interaction:cloud:boy'].distance,100);
assert.equal(album(store.raw).a.count(),2);
const bad=JSON.parse(store.raw);bad.photos['ending:anguirus:boy']={distance:-10,at:1};bad.photos['bogus']={distance:1,at:1};
assert.equal(album(JSON.stringify(bad)).a.count(),2);
const blocked=album(null,true).a;assert.equal(blocked.collect('ending','anguirus','girl',50).saved,false);assert.equal(blocked.count(),1);
for(const entry of a.catalog)assert.ok(fs.existsSync(__dirname+'/'+entry.src),entry.src);
console.log(JSON.stringify({pass:true,catalog:46,corruptSaveCases:6,genderVariants:true,deduplicated:true,blockedStorageKeepsMemory:true}));
