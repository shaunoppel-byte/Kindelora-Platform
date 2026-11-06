const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('emotional-check-in.js','utf8');
const html=fs.readFileSync('index.html','utf8');
function run(){
 const buttons=['yes','somewhat','notyet'].map(feeling=>({dataset:{feeling},attributes:{},setAttribute(k,v){this.attributes[k]=v},addEventListener(_,cb){this.click=cb}}));
 const response={textContent:'',hidden:true};
 const links={'#affirmations':{textContent:'Explore another affirmation'},'#top':{textContent:'Return to a fresh start'}};
 const next={hidden:true,querySelector(sel){return links[sel.slice(2,-2)]||null}};
 // Exact selectors used in production; no DOM or external packages needed.
 next.querySelector=sel=>sel==='a[href="#affirmations"]'?links['#affirmations']:sel==='a[href="#top"]'?links['#top']:null;
 const root={querySelectorAll:()=>buttons,querySelector:sel=>sel==='[data-check-in-response]'?response:next};
 vm.runInNewContext(source,{document:{getElementById:id=>id==='emotional-check-in'?root:null}});
 return {buttons,response,next,links};
}
test('three choices have distinct compassionate responses and keyboard-accessible button semantics',()=>{
 const s=run();const messages=[];
 for(const button of s.buttons){button.click();messages.push(s.response.textContent);assert.equal(s.response.hidden,false);assert.equal(s.buttons.filter(b=>b.attributes['aria-pressed']==='true').length,1);assert.equal(button.attributes['aria-pressed'],'true');}
 assert.equal(new Set(messages).size,3);
 assert.match(messages[0],/glad/i);assert.match(messages[1],/little lighter/i);assert.match(messages[2],/don't have to feel better on demand/i);
 assert.match(html,/data-feeling="yes"/);assert.match(html,/data-feeling="somewhat"/);assert.match(html,/data-feeling="notyet"/);
 assert.match(html,/data-check-in-response role="status" aria-live="polite"/);
});
test('supportive next steps vary appropriately and do not pressure visitors',()=>{
 const s=run();s.buttons[0].click();assert.equal(s.next.hidden,true);
 s.buttons[1].click();assert.equal(s.next.hidden,false);assert.equal(s.links['#affirmations'].textContent,'Explore another affirmation');
 s.buttons[2].click();assert.equal(s.next.hidden,false);assert.equal(s.links['#affirmations'].textContent,'Stay for another gentle affirmation');assert.match(s.links['#top'].textContent,/whenever you feel ready/);
 s.buttons[1].click();assert.equal(s.links['#top'].textContent,'Return to a fresh start');
});
test('check-in is local only and requires no paid infrastructure',()=>{
 assert.doesNotMatch(source,/\b(fetch|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|document\.cookie)\b/);
 assert.match(html,/your choice is not sent, saved, tracked or linked to an account/i);
 assert.match(html,/emotional-check-in\.js\?v=4/);
});
