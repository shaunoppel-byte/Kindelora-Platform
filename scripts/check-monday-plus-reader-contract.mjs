#!/usr/bin/env node
// Static security contract for the shared website/installed-PWA Monday reader.
// This is not production entitlement, storage, audio-playback or release-GO evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const page=read('motivational-monday.html');
const reader=read('monday-plus-reader.js');
const sw=read('sw.js');
const route=read('functions/api/member/monday/[id].js');
assert.match(page,/src="\/monday-plus-reader\.js"/);
assert.match(page,/id="message-text"/);
assert.match(page,/id="narration-audio" controls/);
const audioTag=page.match(/<audio\b[^>]*id="narration-audio"[^>]*>/)?.[0];
assert.ok(audioTag,'audio player missing');
assert.doesNotMatch(audioTag,/\bsrc\s*=/,'premium audio must not have a static source');
assert.match(reader,/credentials:'same-origin'/);
assert.match(reader,/cache:'no-store'/);
for(const code of [401,403,404])assert.match(reader,new RegExp('r\\.status==='+code));
assert.match(reader,/if\(!r\.ok\)/);
assert.match(reader,/audio\.src=endpoint\+'\?format=audio'/);
assert.match(reader,/textContent=value/,'render premium text as text, not injected HTML');
assert.match(route,/verifyPlusEntitlement/);
assert.match(route,/verifiedIdentitySubject:user\.id/);
assert.match(route,/PRIVATE_MONDAY_MEDIA/);
assert.match(route,/private, no-store/);
assert.match(sw,/url\.pathname\.startsWith\("\/api\/"\)/,'PWA must bypass API caching');
assert.ok(!JSON.parse(sw.match(/const ASSETS=(\[[^;]*\]);/s)[1]).includes('/motivational-monday.html'),'Monday page must not be precached');
console.log('PASS: website/PWA Monday reader uses private verified PLUS endpoint, no static audio source, no API precache');
