// Run in the managed QA environment; no application build or server dependency is needed.
import {chromium} from '/opt/codex/cua_node/lib/node_modules/playwright/index.mjs';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=process.cwd(),base='/station-photo-studio/',types={'.js':'text/javascript','.html':'text/html','.css':'text/css','.ttf':'font/ttf','.png':'image/png'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith(base)){res.writeHead(404).end();return}
 const file=path.resolve(root,url.pathname.slice(base.length)||'index.html');if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 try{res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch{res.writeHead(404).end()}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const [entry,script] of [['','app.js'],['booth2.html','booth2.js']]){
  const page=await browser.newPage({viewport:{width:1280,height:1000},acceptDownloads:true}),errors=[],bad=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)bad.push(r.url())});
  await page.route('**/'+script+'*',r=>r.fulfill({contentType:'text/javascript',body:fs.readFileSync(script,'utf8')+'\nwindow.__pagesQA=()=>({state,maskHistory});'}));
  await page.route('**/vendor/face/face_mesh.js*',r=>r.fulfill({contentType:'text/javascript',body:'window.faceCalls=0;window.FaceMesh=class{setOptions(){}onResults(fn){this.result=fn}async send(){window.faceCalls++;this.result({multiFaceLandmarks:[]})}};'}));
  await page.goto(`http://127.0.0.1:${server.address().port}${base}${entry}`);await page.waitForFunction(()=>!document.querySelector('#print').disabled);
  assert.match(await page.locator('#downloadPDF').textContent(),/PDF/);assert.equal(await page.locator('#brushErase').textContent(),'删除');assert.equal(await page.locator('#brushRestore').textContent(),'恢复');
  await page.locator('[data-next="1"]').first().click();await page.locator('#pay').click();
  const file=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=96;c.height=128;const x=c.getContext('2d');x.fillStyle='#c86432';x.fillRect(20,10,56,108);return c.toDataURL().split(',')[1]});
  await page.locator('#upload').setInputFiles({name:'transparent.png',mimeType:'image/png',buffer:Buffer.from(file,'base64')});await page.locator('#busy').waitFor({state:'hidden'});await page.locator('[data-tab="background"]').click();
  assert.match(await page.locator('#segStatus').textContent(),/保留.*透明/);await page.locator('.swatch').nth(1).click();await page.locator('#brushErase').click();
  const bounds=await page.locator('#portrait').boundingBox();await page.mouse.click(bounds.x+bounds.width/2,bounds.y+bounds.height/2);assert.ok(await page.locator('#brushUndo').isEnabled());
  const before=await page.evaluate(()=>{const {state,maskHistory}=window.__pagesQA();return {mask:state.mask.toDataURL(),bg:state.bg,undo:maskHistory.canUndo}});
  await page.locator('[data-tab="beauty"]').click();assert.equal(await page.locator('#faceStatus').isVisible(),true);await page.locator('#retryBeauty').click();await page.locator('#busy').waitFor({state:'hidden'});
  const after=await page.evaluate(()=>{const {state,maskHistory}=window.__pagesQA();return {mask:state.mask.toDataURL(),bg:state.bg,undo:maskHistory.canUndo}});assert.deepEqual(after,before,'face-only retry preserves repaired mask, background and undo history');assert.equal(await page.evaluate(()=>window.faceCalls),2);
  await page.locator('#print').click();const pending=page.waitForEvent('download');await page.locator('#downloadPDF').click();const pdf=await pending;await pdf.saveAs('/tmp/pages-'+script+'.pdf');assert.equal(fs.readFileSync(await pdf.path()).subarray(0,4).toString(),'%PDF');await page.locator('#busy').waitFor({state:'hidden'});
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log(`PASS: ${entry||'index.html'} under ${base}: versioned modules, fonts, transparent input, history, preserved face retry, PDF and phone layout.`);await page.close();
 }
}finally{await browser?.close();await new Promise(r=>server.close(r))}
