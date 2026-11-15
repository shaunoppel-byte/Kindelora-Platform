#!/usr/bin/env node
// Read-only production smoke test. Does not require credentials, change data or unlock PLUS.
const base = process.env.KINDELORA_ORIGIN || "https://kindelora.pages.dev";
const timeout = 15000;
async function check(path) {
 const response = await fetch(new URL(path,base), {redirect:"follow",signal:AbortSignal.timeout(timeout),headers:{"cache-control":"no-cache"}});
 return response;
}
const findings=[];
function record(name,pass,details){findings.push({name,result:pass?"PASS":"BLOCKED",details});}
try {
 const page=await check("/motivational-monday");
 const html=await page.text();
 const newTitle="You Don\\'t Have to Have It All Figured Out".replace("\\'","'");
 const oldTitle="The Difference You May Never See";
 record("Current edition displayed",page.ok&&html.includes(newTitle),{status:page.status,oldEditionPresent:html.includes(oldTitle),newEditionPresent:html.includes(newTitle)});
} catch(e){record("Current edition displayed",false,String(e));}
try {
 const audio=await fetch(new URL("/assets/audio/motivational-monday-2026-11-16-approved.mp3",base),{headers:{range:"bytes=0-1023"},signal:AbortSignal.timeout(timeout)});
 const type=audio.headers.get("content-type")||"";
 const bytes=new Uint8Array(await audio.arrayBuffer());
 const mp3=bytes.length>=3&&(String.fromCharCode(...bytes.slice(0,3))==="ID3"||(bytes[0]===255&&(bytes[1]&224)===224));
 record("First-party MP3 HTTP and header",audio.ok&&mp3,{status:audio.status,contentType:type,bytesRead:bytes.length,mp3Header:mp3});
} catch(e){record("First-party MP3 HTTP and header",false,String(e));}
try {
 const member=await check("/api/member/entitlement");
 // 401 is expected for an unauthenticated visitor; 503 is safe but not production-ready.
 record("Member API available and guest denied",member.status===401,{status:member.status});
} catch(e){record("Member API available and guest denied",false,String(e));}
try {
 const plus=await check("/api/plus/status");
 record("Plus status endpoint available",plus.ok,{status:plus.status});
} catch(e){record("Plus status endpoint available",false,String(e));}
console.log(JSON.stringify({origin:base,checkedAtUtc:new Date().toISOString(),findings,disclaimer:"Public anonymous smoke only. Cannot prove subscriber authorization, mobile playback, content originality or release GO."},null,2));
if(findings.some(x=>x.result!=="PASS"))process.exitCode=1;
