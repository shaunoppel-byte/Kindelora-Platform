// KINDELORA calendar release smoke checks. Run: node --test tests/calendar-smoke.test.cjs
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('app.js','utf8');
const html=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
test('calendar controls and status region exist exactly once',()=>{
 for(const id of ['checkin-time','calendar-google','calendar-outlook','calendar-checkin','calendar-status']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
 }
});
test('calendar handoffs use encoded query parameters and safe external links',()=>{
 assert.match(js,/new URLSearchParams\(\{action:"TEMPLATE"/);
 assert.match(js,/new URLSearchParams\(\{rru:"addevent"/);
 assert.doesNotMatch(js,/path:"\/calendar\/action\/compose"/);
 assert.match(js,/link\.rel="noopener noreferrer"/);
 assert.match(js,/link\.target="_blank"/);
});
test('calendar times roll forward and event has a ten minute duration',()=>{
 assert.match(js,/if\(start<=now\)start\.setDate\(start\.getDate\(\)\+1\)/);
 assert.match(js,/end:new Date\(start\.getTime\(\)\+10\*60000\)/);
 assert.match(js,/toISOString\(\)/);
});
test('ICS has alarm and user-controlled import instructions',()=>{
 for(const line of ['BEGIN:VCALENDAR','BEGIN:VEVENT','BEGIN:VALARM','TRIGGER:PT0M','DTSTART:','DTEND:','END:VCALENDAR'])assert.ok(js.includes(line),line);
 assert.match(js,/Downloading alone does not create a reminder/);
});
test('installed PWA receives new cache version',()=>{
 assert.match(sw,/kindelora-launch-v15/);
 assert.match(html,/app\.js\?v=calendar-clarity-20261105-1/);
});
