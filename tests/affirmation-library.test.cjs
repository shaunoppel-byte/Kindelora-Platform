'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=(name)=>JSON.parse(fs.readFileSync(path.join(root,'affirmations',name),'utf8'));
const batches=['expansion-batch-01.json','expansion-batch-02.json','expansion-batch-03.json','expansion-batch-04.json','expansion-batch-05.json'];
const published=read('library.json');
const staged=batches.map(read);
test('affirmation inventory counts and unique IDs across published and staged collections',()=>{
 assert.equal(published.publishedCount,published.items.length);
 const all=[...published.items,...staged.flatMap(b=>b.items)];
 assert.equal(new Set(all.map(x=>x.id)).size,all.length,'Duplicate affirmation IDs');
 for(const b of staged){assert.equal(b.count,b.items.length);assert.match(b.status,/staged-not-published/);}
});
test('editorial and access integrity for all affirmations',()=>{
 for(const item of [...published.items,...staged.flatMap(b=>b.items)]){
  assert.match(item.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert.ok(item.title.trim().length>=5);
  assert.ok(item.affirmation.trim().length>=35);
  assert.equal(item.access.browse,item.access.featured===false?'plus':'guest');
  assert.equal(item.access.download,item.access.featured===false?'plus':'guest');
  assert.equal(item.access.save,'plus');
 }
});
test('staged affirmations cannot be represented as published before artwork and downloads exist',()=>{
 for(const b of staged)for(const item of b.items){
  assert.equal(item.published,false,item.id+' unexpectedly published');
  assert.equal(item.image??item.photo??null,null,item.id+' image requires release QA');
  assert.equal(item.download,null,item.id+' download requires release QA');
  assert.ok(item.artDirection?.length>20);
 }
});
test('published download targets exist and do not reference staged placeholders',()=>{
 for(const item of published.items){
  assert.ok(item.image?.startsWith('https://')||item.image?.startsWith('/'));
  assert.ok(item.download?.startsWith('/affirmations/'));
  assert.ok(fs.existsSync(path.join(root,item.download.slice(1))),item.download+' missing');
 }
});

test('subscriber library API fails closed for guest and unpaid members',()=>{
 const api=fs.readFileSync(path.join(root,'functions/api/member/affirmation-library.js'),'utf8');
 assert.match(api,/if\(!ready\(env\)\)/);
 assert.match(api,/if\(!user\)/);
 assert.match(api,/if\(!row\)/);
 assert.match(api,/s.status='active'/);
 assert.match(api,/email_verified_at IS NOT NULL/);
 assert.match(api,/items:\[\]/);
});
