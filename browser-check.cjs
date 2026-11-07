const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const assert = require('assert/strict');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  const context = await browser.newContext({viewport:{width:1280,height:720}});
  const page = await context.newPage(), errors=[];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8765');
  await page.waitForFunction(() => ['pilotFrame3','mothFrame3','rodanFrame3','birds','cannon'].every(k=>window.kaijuArt.get(k)));
  await page.locator('#openWorkshop').click();
  await page.locator('#workshop').waitFor({state:'visible'});
  assert.equal(await page.locator('[data-buy]:disabled').count(),7);
  await page.locator('#closeWorkshop').click();
  await page.locator('[data-mode="distance"]').click();
  await page.keyboard.press('Space'); await page.keyboard.press('Space');
  await page.keyboard.down('Space'); await page.waitForTimeout(1500); await page.keyboard.up('Space');
  await page.screenshot({path:'art_prototypes/full_assets/qa-flight.png'});
  await page.evaluate(()=>{
    const g=window.__KAIJU__; g.S.frozen=true;
    for(let i=0;i<36000&&g.S.phase!=='result';i++)g.step(1/60);
  });
  await page.locator('#result').waitFor({state:'visible'});
  assert.ok(await page.locator('#runReward').textContent());
  const before=await page.evaluate(()=>window.kaijuProgress.data.points);
  await page.evaluate(()=>window.__KAIJU__.showResult());
  assert.equal(await page.evaluate(()=>window.kaijuProgress.data.points),before);
  // Earn the first upgrade through completed simulated flights in this disposable browser profile.
  await page.evaluate(()=>{
    const g=window.__KAIJU__;
    for(let n=0;n<4;n++){
      g.startGame('distance',0);g.press();g.press();g.release();g.S.frozen=true;
      for(let i=0;i<36000&&g.S.phase!=='result';i++)g.step(1/60);
    }
  });
  await page.locator('#resultWorkshop').click();
  await page.locator('[data-buy="stamina"]').click();
  await page.locator('[data-equip="stamina"]').selectOption('0');
  await page.screenshot({path:'art_prototypes/full_assets/qa-workshop.png'});
  await page.reload();
  assert.equal(await page.evaluate(()=>window.kaijuProgress.data.owned.stamina),1);
  assert.equal(await page.evaluate(()=>window.kaijuProgress.snapshot().stamina),0);
  for(const stage of [1,2,3,4]){
    await page.goto('http://127.0.0.1:8765/?artpreview='+stage);
    await page.waitForTimeout(600);
    await page.screenshot({path:'art_prototypes/full_assets/qa-stage'+stage+'.png'});
  }
  await page.goto('http://127.0.0.1:8765/?test=1');
  const selftest=await page.locator('#test-out').textContent();
  assert.equal(JSON.parse(selftest).pass,true,selftest);
  const mobile=await context.newPage({viewport:{width:390,height:844}});
  await mobile.setViewportSize({width:390,height:844});
  await mobile.goto('http://127.0.0.1:8765');
  await mobile.locator('#openWorkshop').click();
  await mobile.screenshot({path:'art_prototypes/full_assets/qa-mobile.png'});
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({pass:true,selftest:JSON.parse(selftest),browserErrors:errors}));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
