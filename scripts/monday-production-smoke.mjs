#!/usr/bin/env node
// Read-only anonymous production security smoke; cannot certify paid-member access.
const base=process.env.KINDELORA_ORIGIN||"https://kindelora.pages.dev";
const edition="mm-2026-11-16";
const findings=[];
const check=async path=>fetch(new URL(path,base),{redirect:"manual",signal:AbortSignal.timeout(15000),headers:{"cache-control":"no-cache"}});
function record(name,pass,details){findings.push({name,result:pass?"PASS":"BLOCKED",details});}
for(const [name,path,expected] of [
 ["Monday landing page available","/motivational-monday",200],
 ["Secure Monday reader JavaScript deployed","/monday-plus-reader.js",200],
 ["PLUS-only edition denies anonymous visitors","/api/member/monday/"+edition,401],
 ["PLUS-only audio denies anonymous visitors","/api/member/monday/"+edition+"?format=audio",401],
 ["Membership endpoint denies anonymous visitors","/api/member/entitlement",401]
]){
 try{const response=await check(path);record(name,response.status===expected,{status:response.status,expected});}
 catch(e){record(name,false,String(e));}
}
try{
 const response=await check("/assets/audio/motivational-monday-2026-11-16-approved.mp3");
 // 404/410 prove the public URL is not serving the PLUS-only recording.
 // 401/403 are also acceptable if access is enforced by an edge function.
 record("Approved PLUS MP3 not publicly retrievable",[401,403,404,410].includes(response.status),{status:response.status});
}catch(e){record("Approved PLUS MP3 not publicly retrievable",false,String(e));}
if(process.env.GITHUB_STEP_SUMMARY){
 const fs=await import('node:fs');
 const rows=['## KINDELORA Monday production readiness (anonymous only)','', '| Check | Result | HTTP status |','|---|---|---|',...findings.map(f=>'| '+f.name+' | '+f.result+' | '+(f.details?.status??'n/a')+' |'),'','This does not certify paid subscriber access, audio playback, private R2 publication, editorial release GO or PayFast.',''];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,rows.join('\\n'));
}
console.log(JSON.stringify({origin:base,checkedAtUtc:new Date().toISOString(),findings,disclaimer:"Anonymous checks only. A pass does not establish paid-member access, mobile playback, independent editorial QA, release timing or final GO."},null,2));
if(findings.some(x=>x.result!=="PASS"))process.exitCode=1;
