const {chromium}=require('../tmp/qa/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');fs.mkdirSync('qa',{recursive:true});
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
 const context=await b.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[],sent=[];let enabled=true,fail=false,delay=0;
 p.on('pageerror',e=>errors.push(e.message));
 await context.route('https://peizhen-ai-help-20261123.newmoat6.chatgpt.site/**',async route=>{
  const req=route.request(),cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type, X-Peizhen-Client','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
  if(req.url().endsWith('/health'))return route.fulfill({status:200,headers:cors,json:{ready:enabled,provider:'DeepSeek'}});
  sent.push(req.postDataJSON());if(delay)await new Promise(r=>setTimeout(r,delay));
  return route.fulfill({status:fail?429:200,headers:cors,json:fail?{message:'今天的答疑额度已用完'}:{reply:'这是一条仅用于测试的模拟解释。<script>window.aiUnsafe=true</script>',provider:'DeepSeek'}});
 });
 await p.goto('http://127.0.0.1:5173');await p.locator('[data-action="sequential"]').first().click();
 await p.locator('.ai-panel summary').click();await p.locator('.ai-badge.ready').waitFor();
 await p.locator('[data-option="B"]').click();await p.locator('[data-ai-prompt]').first().click();await p.locator('.ai-message.assistant').waitFor();
 assert.equal(sent[0].questionId,'single-1');assert.deepEqual(sent[0].selected,['B']);assert.deepEqual(sent[0].history,[]);assert.equal(await p.evaluate(()=>window.aiUnsafe),undefined);
 await p.locator('#ai-question-input').fill('能再举个例子吗？');await p.locator('.ai-form [type="submit"]').click();await p.waitForFunction(()=>document.querySelectorAll('.ai-message.assistant').length===2);assert.equal(sent[1].history.length,2);
 await p.locator('[data-ai-action="clear"]').click();assert.equal(await p.locator('.ai-message').count(),0);
 fail=true;await p.locator('#ai-question-input').fill('请解释');await p.locator('.ai-form [type="submit"]').click();await p.locator('.ai-error').waitFor();assert.equal(await p.locator('#ai-question-input').inputValue(),'请解释');assert.equal(await p.locator('.ai-message').count(),0);
 fail=false;delay=300;await p.locator('.ai-form [type="submit"]').click();await p.locator('[data-action="next"]').click();assert.equal(await p.locator('.ai-message.assistant').count(),0);await p.waitForTimeout(500);await p.locator('[data-action="prev"]').click();await p.locator('.ai-message.assistant').waitFor();assert.equal(sent.at(-1).questionId,'single-1');
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await p.screenshot({path:'qa/ai-mobile-conversation.png',fullPage:true});
 await p.evaluate(()=>location.hash='exam');await p.locator('[data-action="start-exam"]').click();await p.locator('#timer').waitFor();assert.equal(await p.locator('.ai-panel').count(),0);
 enabled=false;await p.reload();await p.evaluate(()=>location.hash='home');await p.locator('[data-action="sequential"]').first().click();await p.locator('.ai-panel summary').click();await p.waitForFunction(()=>document.querySelector('.ai-badge')?.textContent==='尚未开通');assert.ok(await p.locator('.ai-form [type="submit"]').isDisabled());
 await p.screenshot({path:'qa/ai-mobile-not-configured.png',fullPage:true});
 const offline=await context.newPage();const {pathToFileURL}=require('node:url');await offline.goto(pathToFileURL(require('node:path').resolve('dist/offline.html')).href);await offline.locator('[data-action="sequential"]').first().click();await offline.locator('.ai-panel summary').click();assert.equal(await offline.locator('.ai-form').count(),0);assert.equal(await offline.locator('.ai-panel a').getAttribute('href'),'https://esplorare.github.io/peizhen-study/');
 assert.deepEqual(errors,[]);console.log('AI UI passed: contextual request, selected answer, follow-up, safe text rendering, errors and retry, switching questions, mobile layout, unavailable-service state, exam isolation and offline behavior. Real model calls were mocked.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
