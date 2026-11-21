// Run: node --test tests/special-moments-calendar.test.cjs
// Tests are local-only and never transmit private occasion labels.
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const script=fs.readFileSync(path.join(__dirname,'..','special-moments-calendar.js'),'utf8');
const files=[];
const ctx={window:{},crypto:{randomUUID:()=> '123e4567-e89b-42d3-a456-426614174000'},TextEncoder,Date,Blob,File:class{constructor(parts,name,options){this.parts=parts;this.name=name;this.type=options.type}},navigator:{},document:{body:{append(){}},createElement:()=>({click(){},remove(){}})},URL:{createObjectURL:b=>{files.push(b);return 'blob:test'},revokeObjectURL(){}},setTimeout:()=>{}};
vm.createContext(ctx);vm.runInContext(script,ctx);
async function download(item){ctx.window.KindeloraCalendar.download(item);return await files.pop().text();}
test('yearly all-day event is local and calendar compatible',async()=>{
 const data=await download({label:'Our anniversary',month:6,day:15});
 assert.match(data,/BEGIN:VCALENDAR\r\nVERSION:2.0\r\n/);
 assert.match(data,/DTSTART;VALUE=DATE:\d{4}0615\r\n/);
 assert.match(data,/RRULE:FREQ=YEARLY\r\n/);
 assert.match(data,/SUMMARY:Our anniversary\r\n/);
 assert.match(data,/END:VCALENDAR\r\n$/);
});
test('escapes event labels to prevent ICS field injection',async()=>{
 const data=await download({label:'Family, friends; together\\forever\nBEGIN:VALARM',month:1,day:1});
 assert.equal((data.match(/BEGIN:VEVENT/g)||[]).length,1);
 assert.equal((data.match(/BEGIN:VALARM/g)||[]).length,0);
 assert.match(data,/SUMMARY:Family\\, friends\\; together/);
});
test('rejects impossible calendar dates',()=>assert.throws(()=>ctx.window.KindeloraCalendar.download({label:'Invalid',month:4,day:31}),/Invalid date/));
test('supports Feb 29 without inventing a non-leap date',async()=>{
 const data=await download({label:'Leap birthday',month:2,day:29});
 assert.match(data,/DTSTART;VALUE=DATE:20240229\r\n/);
});
test('calendar export contains no automatic messaging or third-party recipient',async()=>{
 const data=await download({label:'Private occasion',month:10,day:10});
 assert.doesNotMatch(data,/ATTENDEE|ORGANIZER|mailto:|https:\/\/wa\.me/i);
});
