'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const BASE = 'http://127.0.0.1:8765/';
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRpoAAAAASUVORK5CYII=', 'base64');
(async () => {
  const browser = await chromium.launch({ headless:true });
  let tested=0;
  try {
    for (const width of [320,360,390,640,641,768,820,1023,1024,1280,1440]) {
      const mobile=width<=640,tablet=width>=641&&width<=1023;
      const ctx=await browser.newContext({viewport:{width,height:850},hasTouch:mobile,isMobile:mobile,deviceScaleFactor:1});
      const page=await ctx.newPage();
      const errors=[];
      page.on('pageerror',err=>errors.push(err.message));
      await page.goto(BASE,{waitUntil:'load'});
      await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('Ready.'),{timeout:15000});
      const info=await page.evaluate(()=>{
        const visible=s=>{const el=document.querySelector(s),c=getComputedStyle(el);return c.display!=='none'&&c.visibility!=='hidden'&&el.getBoundingClientRect().width>0;};
        return {dock:visible('.dock'),tabletPanel:visible('.tablet-panel'),desktopActions:visible('.desktop-actions'),horizontalOverflow:document.documentElement.scrollWidth>innerWidth+1,canvasTouch:getComputedStyle(document.querySelector('canvas')).touchAction,bodyTouch:getComputedStyle(document.body).touchAction,menuHidden:document.querySelector('#photoMenu').hidden,favicon:!!document.querySelector('link[rel="icon"][href*="favicon.svg"]')};
      });
      assert.equal(info.dock,mobile,'mobile dock breakpoint '+width);
      assert.equal(info.tabletPanel,tablet,'tablet controls breakpoint '+width);
      assert.equal(info.desktopActions,!mobile&&!tablet,'desktop actions breakpoint '+width);
      assert.equal(info.horizontalOverflow,false,'horizontal overflow at '+width);
      assert.equal(info.canvasTouch,'none','canvas is only gesture surface');
      assert.notEqual(info.bodyTouch,'none','page pinch is not disabled');
      assert.equal(info.menuHidden,true);
      assert.equal(info.favicon,true);
      await page.setInputFiles('#photo',{name:'test.png',mimeType:'image/png',buffer:PNG});
      await page.waitForFunction(()=>document.querySelector('#sharePoster').disabled===false,{timeout:10000});
      assert.equal(await page.locator('.dock [data-primary-action]').textContent().then(t=>t.includes('Download poster')),true,'download action '+width);
      if(mobile){
        const box=await page.locator('#poster').boundingBox();
        await page.dispatchEvent('#poster','pointerdown',{pointerId:10,pointerType:'touch',button:0,clientX:box.x+box.width/2,clientY:box.y+box.height/2});
        await page.waitForTimeout(600);
        assert.equal(await page.locator('#photoMenu').isVisible(),true,'press-and-hold menu on mobile '+width);
        await page.dispatchEvent('#poster','pointerup',{pointerId:10,pointerType:'touch',clientX:box.x+box.width/2,clientY:box.y+box.height/2});
        await page.locator('[data-photo-action="fit"]').click();
        assert.equal(await page.locator('#photoMenu').isVisible(),false,'photo popup closes');
      }
      assert.deepEqual(errors,[],'no browser JS errors at '+width);
      console.log('PASS',width, mobile?'mobile':tablet?'tablet':'desktop');
      tested++;
      await ctx.close();
    }
    console.log('All '+tested+' responsive breakpoints passed.');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
