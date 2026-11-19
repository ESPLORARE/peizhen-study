let chromium;try{({chromium}=require('playwright'));}catch{({chromium}=require('../tmp/qa/node_modules/playwright'));}
const fs=require('node:fs');
const assert=require('node:assert/strict');
const path=require('node:path');
const out=path.join(__dirname,'qa');fs.mkdirSync(out,{recursive:true});
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'question-bank.json'),'utf8'));
const KEY='peizhen-study-v1';
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const context=await browser.newContext({viewport:{width:1440,height:1080},acceptDownloads:true});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
const click=async selector=>{await page.locator(selector).first().click();};
const route=async route=>{await page.evaluate(r=>location.hash=r,route);await page.waitForTimeout(70);};
const save=async state=>{await page.evaluate(({key,s})=>localStorage.setItem(key,JSON.stringify(s)),{key:KEY,s:state});await page.reload();};
const openOne=async(id,reveal=false)=>{const s=await read();s.practice={ids:[id],index:0,answers:{},drafts:{},title:'验证练习',reveal,review:false,startedAt:Date.now()};await save(s);await route('practice');};
await page.goto('http://127.0.0.1:5173');await page.locator('h1').waitFor();
await click('[data-action="sequential"]');await page.locator('[data-option="A"]').waitFor();
await click('[data-option="A"]');await click('[data-action="submit-answer"]');
assert.equal((await read()).records['single-1'].lastCorrect,false);
await page.getByText('本题答错',{exact:true}).waitFor();
await click('[data-favorite="single-1"]');
await page.locator('.notes summary').click();await page.locator('[data-note]').fill('核心知识：社会经济关系。<script>安全文本</script>');
await page.reload();await page.getByText('本题答错',{exact:true}).waitFor();assert.equal((await read()).favorites[0],'single-1');assert.ok(await page.locator('[data-note]').inputValue());
await route('wrong');assert.equal(await page.locator('.question-row').count(),1);
await click('[data-action="list-start"]');await click('[data-option="B"]');await click('[data-action="submit-answer"]');assert.equal((await read()).records['single-1'].lastCorrect,true);
await route('wrong');assert.equal(await page.locator('.question-row').count(),0);
await openOne('multiple-70');assert.equal(await page.locator('[data-option]').count(),5);
for(const k of ['A','B','C','E'])await click(`[data-option="${k}"]`);
await click('[data-action="submit-answer"]');assert.equal((await read()).records['multiple-70'].lastCorrect,true);
await openOne('multiple-1');await click('[data-option="A"]');await click('[data-action="submit-answer"]');assert.equal((await read()).records['multiple-1'].lastCorrect,false);
await openOne('boolean-1');await click('[data-option="F"]');await click('[data-action="submit-answer"]');assert.equal((await read()).records['boolean-1'].lastCorrect,true);
await openOne('single-245',true);await page.getByText('原文核对提示：',{exact:false}).waitFor();assert.equal((await read()).records['single-245'],undefined);
await route('library');await page.locator('#search').fill('道德是由什么决定的');assert.equal(await page.locator('.question-row').count(),1);await page.locator('#search').fill('');await click('[data-filter="multiple"]');await page.locator('#category').selectOption('营养与食品');assert.equal(await page.locator('.question-row').count(),2);await click('[data-action="reset-filters"]');
await page.locator('#status').selectOption('issue');assert.equal(await page.locator('.question-row').count(),10);
await route('exam');await click('[data-exam-count="20"]');await click('[data-action="start-exam"]');assert.equal((await read()).exam.ids.length,20);assert.equal(new Set((await read()).exam.ids).size,20);
await click('[data-option="A"], [data-option="T"]');assert.ok((await read()).exam.drafts);assert.ok((await page.locator('.side-summary').innerText()).includes('已答 1 题'));assert.equal(await page.locator('.explanation').count(),0);
const endAt=(await read()).exam.endAt;await page.reload();assert.equal((await read()).exam.endAt,endAt);await click('[data-action="finish-exam"]');await click('[data-modal="confirm"]');await page.locator('.result-score').waitFor();assert.equal((await read()).history.length,1);assert.equal((await read()).exam,null);
await page.reload();await page.locator('.result-score').waitFor();await click('[data-action="result-review"]');await page.locator('.explanation').waitFor();
// Timed automatic submission survives navigation and reload.
let s=await read();s.exam={ids:['single-2','boolean-2'],answers:{},drafts:{'single-2':['D']},index:0,title:'计时验证',startedAt:Date.now()-60000,endAt:Date.now()-1,minutes:1};await save(s);await page.waitForTimeout(150);assert.equal((await read()).exam,null);assert.equal((await read()).history.length,2);
await route('settings');const dl=page.waitForEvent('download');await click('[data-action="export"]');const download=await dl;await download.saveAs(path.join(out,'backup-test.json'));const backup=JSON.parse(fs.readFileSync(path.join(out,'backup-test.json'),'utf8'));assert.ok(backup.records['multiple-70']);
await page.locator('#import-file').setInputFiles(path.join(out,'backup-test.json'));await page.locator('[data-modal="confirm"]').waitFor();await click('[data-modal="confirm"]');assert.equal((await read()).history.length,2);
await click('#big-text');assert.equal(await page.locator('body.big-text').count(),1);await click('#big-text');
const pdf=await context.request.get('http://127.0.0.1:5173/source.pdf');assert.equal(pdf.status(),200);
// Clean isolated browser storage for screenshots, not the user's browser.
await page.evaluate(key=>localStorage.removeItem(key),KEY);await route('home');await page.reload();
await page.screenshot({path:path.join(out,'desktop-home.png'),fullPage:true});
for(const width of [360,390,768,1024,1440]){
 await page.setViewportSize({width,height:900});
 for(const r of ['home','library','wrong','favorites','exam','settings']){
  await route(r);const over=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);
  assert.equal(over,false,`horizontal overflow ${width} ${r}`);
 }
 await route('home');await click('[data-action="sequential"]');await page.locator('[data-option="A"]').waitFor();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false,`practice overflow ${width}`);
 if(width===390){await page.screenshot({path:path.join(out,'mobile-practice.png'),fullPage:true});await route('home');await page.screenshot({path:path.join(out,'mobile-home.png'),fullPage:true});}
}
assert.deepEqual(errors,[]);const result={passed:true,questions:bank.questions.length,viewports:[360,390,768,1024,1440],browser:'Edge headless',checks:['single, multiple and boolean scoring','five-option multiple choice and partial-answer rejection','wrong questions cleared after correct reattempt','favorites and safe notes persistence','refresh session recovery','search, type, category and issue filters','20-question proportional exam and no pre-submission answers','exam progress and persisted timer','grading including unanswered questions','result refresh and answer review','automatic timed submission','JSON backup round trip','large type option','source PDF availability','horizontal overflow across all main routes','no uncaught JavaScript errors']};
fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
