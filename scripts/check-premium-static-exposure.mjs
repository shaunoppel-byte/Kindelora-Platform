#!/usr/bin/env node
// P0 regression guard: checks known premium static leak paths.
// This does NOT replace live HTTP, entitlement or payment E2E testing.
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('motivational-monday.html');
const sw=read('sw.js');
const middleware=read('functions/_middleware.js');
const index=read('index.html');
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
assert(!page.includes('The Difference You May Never See'),'Premium Monday full-message title leaked in public HTML');
assert(!page.includes('heygen-speech-2.mp3'),'Premium MP3 referenced from public HTML');
assert(!fs.existsSync(new URL('../assets/audio/heygen-speech-2.mp3',import.meta.url)),'Premium MP3 publicly hosted under static assets');
assert(!index.includes('heygen-speech-2.mp3'),'Homepage exposes premium MP3');
assert(!/const ASSETS=\[[^;]*motivational-monday\.html/s.test(sw),'Service worker precaches premium Monday HTML');
assert(middleware.includes('onRequest')&&middleware.includes('403'),'No fail-closed premium middleware');
assert(middleware.includes('(?:plus|premium|members)'),'Premium namespaces not denied by default');
assert(sw.includes('(?:plus|premium|members)'),'Offline premium namespaces not denied by default');
assert(!page.includes('play the professionally narrated recording.'),'Public preview falsely promises live audio');
assert(page.includes('currently withheld'),'Public Monday teaser is not in fail-closed state');
console.log(JSON.stringify({check:'known premium static exposure',passed:failures.length===0,failures},null,2));
if(failures.length)process.exitCode=1;
