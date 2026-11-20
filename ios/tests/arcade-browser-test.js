// Optional real-browser smoke check: PLAYWRIGHT_MODULE may point to a local installation.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const http=require('http'),fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../Web');
const server=http.createServer((req,res)=>{
 const file=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(e,b)=>{if(e){res.writeHead(404).end();return;}res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(b);});
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  for(const [width,height] of [[320,568],[390,760],[844,320],[768,980]]){
   const page=await browser.newPage({viewport:{width,height},hasTouch:true});const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:'+server.address().port+'/index.html');
   await page.locator('.category[data-category="arcade"]').click();
   assert.equal(await page.locator('.menuButton[data-category="arcade"]:visible').count(),6);
   assert(await page.evaluate(()=>document.getElementById('menu').scrollHeight<=document.getElementById('menu').clientHeight+1),'Arcade menu has no scrolling');
   for(const kind of ['pong','breakout','blocks','invaders','flappy']){
    await page.locator('[data-arcade="'+kind+'"]').click();await page.waitForTimeout(80);
    assert(await page.locator('#arcade.active').isVisible());
    const fits=await page.evaluate(()=>{const c=document.getElementById('arcadeCanvas').getBoundingClientRect(),b=document.getElementById('arcadeControls').getBoundingClientRect();return c.width>0&&c.height>0&&c.right<=innerWidth+1&&c.bottom<=innerHeight+1&&b.bottom<=innerHeight+1;});
    assert(fits,kind+' stage/controls fit '+width+'x'+height);
    await page.locator('#arcadePlay').click();await page.waitForTimeout(80);
    await page.locator('#arcadePause').click();assert(await page.locator('#arcadeOverlay').isVisible());
    await page.locator('#back').click();
   }
   await page.locator('[data-arcade="multiplicatingkid"]').click();
   await page.locator('#mathNew').click();assert.equal(await page.locator('#mathAnswers button').count(),4);
   await page.locator('#mathAnswers button').first().click();assert(await page.locator('#mathFeedback').textContent());
   await page.locator('#back').click();
   await page.locator('.category[data-category="games"]').click();await page.locator('[data-game="ttt"]').click();
   await page.locator('#tttBoard [role="button"]').first().click();
   assert.equal(errors.length,0,errors.join('\n'));
   await page.close();
  }
  console.log('Browser smoke passed: six Arcade launchers, all five canvases/controls, real touch clicks, pause/menu, math and original TTT at four viewports');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
