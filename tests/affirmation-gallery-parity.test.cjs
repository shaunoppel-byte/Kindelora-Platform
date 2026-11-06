'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const published=JSON.parse(fs.readFileSync('affirmations/library.json','utf8')).items;
const staged=['expansion-batch-01.json','expansion-batch-02.json'].flatMap(p=>JSON.parse(fs.readFileSync('affirmations/'+p,'utf8')).items);
const start=html.indexOf('id="free-affirmations"');
const end=html.indexOf('</section>',start);
const section=html.slice(start,end);
test('published gallery has exact approved card count',()=>{
 assert.ok(start>=0 && end>start);
 assert.equal(section.split('<article class="free-affirmation-card">').length-1,published.length);
 for(const item of staged)assert.ok(!section.includes('<h3>'+item.title+'</h3>'),'Unpublished card leaked: '+item.id);
});
test('each published gallery card matches inventory and Plus Save disclosure',()=>{
 for(const item of published){
  const titlePos=section.indexOf('<h3>'+item.title+'</h3>');
  assert.ok(titlePos>=0,'Missing '+item.id);
  const cardStart=section.lastIndexOf('<article class="free-affirmation-card">',titlePos);
  const cardEnd=section.indexOf('</article>',titlePos);
  const card=section.slice(cardStart,cardEnd);
  assert.ok(card.includes('src="'+item.image+'"'),'Image mismatch: '+item.id);
  assert.ok(card.includes(item.affirmation),'Wording mismatch: '+item.id);
  assert.ok(card.includes('href="'+item.download+'"'),'Download mismatch: '+item.id);
  assert.ok(card.includes('data-heart-type="affirmation"'),'Save type mismatch: '+item.id);
  assert.ok(card.includes('membership required'),'Missing Plus disclosure: '+item.id);
 }
});
