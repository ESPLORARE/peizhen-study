const {chromium}=require('../tmp/qa/node_modules/playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');fs.mkdirSync('qa',{recursive:true});
const TEST_KEY='sk-test-only-personal-browser-key';
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),errors=[],requests=[];
 let modelStatus=200,chatStatus=200,delay=0,networkFailures=0,modelRequests=0;
 page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{AbortSignal.timeout=undefined;});
 // Any contact with the retired service is a regression, even during validation.
 await context.route('**/*.chatgpt.site/**',route=>{throw Error('Retired intermediary contacted: '+route.request().url());});
 await context.route('https://api.deepseek.com/**',async route=>{
  const req=route.request(),url=new URL(req.url()),cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
  if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
  assert.equal(req.headers().authorization,'Bearer '+TEST_KEY);
  if(url.pathname==='/models'){
   modelRequests++;if(networkFailures-->0)return route.abort('failed');
   return route.fulfill({status:modelStatus,headers:cors,json:modelStatus===200?{data:[{id:'deepseek-flash'}]}:{error:{message:'raw error that must not be shown '+TEST_KEY}}});
  }
  assert.equal(url.pathname,'/chat/completions');const body=req.postDataJSON();assert.ok(!JSON.stringify(body).includes(TEST_KEY));requests.push(body);
  if(delay)await new Promise(r=>setTimeout(r,delay));
  return route.fulfill({status:chatStatus,headers:cors,json:chatStatus===200?{choices:[{message:{content:'仅用于测试的解释。<script>window.aiUnsafe=true</script>'}}]}:{error:{message:'raw upstream detail '+TEST_KEY}}});
 });
 const open=async()=>{await page.goto('http://127.0.0.1:5173');await page.locator('[data-action="sequential"]').first().click();await page.locator('.ai-panel summary').click();};
 const configure=async()=>{await page.locator('#ai-key-input').fill(TEST_KEY);await page.locator('.ai-key-form [type="submit"]').click();};
 await open();assert.equal(modelRequests,0);assert.ok(await page.locator('.ai-form [type="submit"]').isDisabled());assert.equal(await page.locator('#ai-key-input').getAttribute('type'),'password');
 await page.locator('#ai-key-input').fill('wrong-format');await page.locator('.ai-key-form [type="submit"]').click();assert.equal(modelRequests,0);assert.ok((await page.locator('.ai-availability').innerText()).includes('格式'));
 networkFailures=1;await configure();await page.locator('.ai-badge.ready').waitFor();assert.equal(modelRequests,2);
 assert.equal(await page.locator('#ai-key-input').inputValue(),'');assert.ok(!(await page.content()).includes(TEST_KEY));
 assert.ok(!(await page.evaluate(()=>JSON.stringify({local:{...localStorage},session:{...sessionStorage}}))).includes(TEST_KEY));
 await page.locator('[data-option="B"]').click();await page.locator('[data-ai-prompt]').first().click();await page.locator('.ai-message.assistant').waitFor();
 assert.equal(requests[0].model,'deepseek-flash');assert.equal(requests[0].max_tokens,1400);assert.ok(requests[0].messages[1].content.includes('社会经济关系'));assert.equal(await page.evaluate(()=>window.aiUnsafe),undefined);
 assert.equal(requests[0].messages.length,3);assert.equal(requests[0].messages[0].role,'system');
 await page.locator('#ai-question-input').fill('请再举例');await page.locator('.ai-form [type="submit"]').click();await page.waitForFunction(()=>document.querySelectorAll('.ai-message.assistant').length===2);assert.equal(requests[1].messages.length,5);
 await page.locator('[data-action="next"]').click();await page.locator('.ai-panel summary').click();assert.equal(await page.locator('.ai-badge.ready').count(),1);assert.equal(await page.locator('.ai-message').count(),0);
 chatStatus=402;await page.locator('[data-ai-prompt]').first().click();await page.locator('.ai-error').waitFor();assert.ok((await page.locator('.ai-error').innerText()).includes('余额不足'));assert.ok(!(await page.content()).includes(TEST_KEY));assert.equal(requests.length,3,'Paid chat requests must not be automatically retried');
 chatStatus=200;await page.locator('.ai-form [type="submit"]').click();await page.locator('.ai-message.assistant').waitFor();
 await page.screenshot({path:'qa/personal-ai-mobile.png',fullPage:true});
 await page.locator('[data-ai-action="forget"]').click();assert.equal(await page.locator('.ai-message').count(),0);assert.equal(await page.locator('.ai-badge.ready').count(),0);assert.ok(await page.locator('.ai-form [type="submit"]').isDisabled());
 modelStatus=401;await configure();await page.locator('.ai-availability.has-error').waitFor();assert.ok(!(await page.content()).includes(TEST_KEY));assert.equal(await page.locator('.ai-badge.ready').count(),0);
 modelStatus=200;await page.locator('[data-ai-action="verify"]').click();await page.locator('.ai-badge.ready').waitFor();
 delay=200;await page.locator('[data-ai-prompt]').first().click();await page.locator('[data-ai-action="forget"]').click();await page.waitForTimeout(350);assert.equal(await page.locator('.ai-message').count(),0);assert.equal(await page.locator('.ai-badge.ready').count(),0);delay=0;
 await configure();await page.locator('.ai-badge.ready').waitFor();
 await page.reload();assert.equal(await page.locator('.ai-badge.ready').count(),0);assert.equal(await page.locator('#ai-key-input').inputValue(),'');
 await page.evaluate(()=>location.hash='exam');await page.locator('[data-action="start-exam"]').click();await page.locator('#timer').waitFor();assert.equal(await page.locator('.ai-panel').count(),0);
 const offline=await context.newPage();await offline.goto(require('node:url').pathToFileURL(require('node:path').resolve('dist/offline.html')).href);await offline.locator('[data-action="sequential"]').first().click();await offline.locator('.ai-panel summary').click();assert.equal(await offline.locator('.ai-form').count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 for(const width of [360,768,1440]){await page.setViewportSize({width,height:900});await open();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
 assert.deepEqual(errors,[]);console.log('PASS: personal-key direct API, fixed official destination, no storage/DOM leakage, no intermediary traffic, legacy browser, key verification/retry, contextual prompts, follow-up, isolated questions, safe text, balance/auth errors, no paid retry, key clearing, refresh, exam and offline behavior. Model responses were mocked.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
