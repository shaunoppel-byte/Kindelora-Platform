#!/usr/bin/env node
// Safe incremental rollout for original KINDELORA artwork.
// Usage: node scripts/apply-staged-affirmation-artwork.mjs --check
//        node scripts/apply-staged-affirmation-artwork.mjs --write
// Unapproved entries are untouched; the final catalogue must not gain duplicates.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'quality/affirmation-artwork-remediation.json'),'utf8'));
const sourceFile=path.join(root,'affirmation-library.js');
const source=fs.readFileSync(sourceFile,'utf8');
const start=source.indexOf('const items=['),end=source.indexOf('];',start);
if(start<0||end<0)throw Error('Catalogue not found');
const matches=[...source.slice(start,end).matchAll(/\{id:(['"])(.*?)\1,title:(['"])(.*?)\3,text:(['"])(.*?)\5,tags:(['"])(.*?)\7,image:(['"])(.*?)\9\}/g)];
if(matches.length!==400)throw Error('Expected 400 affirmations, got '+matches.length);
const manifestMap=new Map(manifest.entries.map(e=>[e.id,e]));
if(manifestMap.size!==400)throw Error('Manifest must contain 400 distinct IDs');
const errors=[],changed=[],planned=new Map();
for(const m of matches){
 const id=m[2],entry=manifestMap.get(id);
 if(!entry){errors.push(id+': missing manifest entry');continue}
 const target=(entry.replacementAsset||'').trim();
 if(!target)continue;
 if(entry.qaStatus!=='approved'||!(entry.licenseEvidence||'').trim()){errors.push(id+': missing QA approval or provenance');continue}
 if(!/^\/assets\/affirmations\/[a-zA-Z0-9_./-]+\.(webp|avif|jpg|jpeg|png)$/.test(target)){errors.push(id+': only local, versioned image assets permitted');continue}
 const file=path.resolve(root,'.'+target);
 if(!file.startsWith(path.join(root,'assets','affirmations')+path.sep)||!fs.existsSync(file)){errors.push(id+': asset missing or outside artwork directory');continue}
 const bytes=fs.readFileSync(file);
 if(bytes.length<10000){errors.push(id+': image unusually small');continue}
 const digest=crypto.createHash('sha256').update(bytes).digest('hex');
 if(entry.sha256&&entry.sha256!==digest){errors.push(id+': checksum mismatch');continue}
 if(target!==m[10])changed.push({id,from:m[10],to:target});
 planned.set(id,target);
}
const identities=new Map();
for(const m of matches){
 const id=m[2],url=planned.get(id)||m[10],identity=url.split('?')[0].replace(/\/$/,'');
 const ids=identities.get(identity)||[];ids.push(id);identities.set(identity,ids);
}
const before=new Set(matches.map(m=>m[10].split('?')[0].replace(/\/$/,''))).size;
const after=identities.size;
if(after<before)errors.push('Artwork uniqueness regressed from '+before+' to '+after);
for(const [asset,ids] of identities){
 if(ids.length>1&&ids.some(id=>planned.has(id)))errors.push('Approved artwork still shared: '+asset+' ('+ids.join(', ')+')');
}
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
if(process.argv.includes('--write')){
 let next=source;
 for(const m of [...matches].reverse()){
  if(!planned.has(m[2]))continue;
  const original=m[0],replacement=original.replace(/image:(['"])(.*?)\1/,(_,q)=>'image:'+q+planned.get(m[2])+q);
  const at=start+m.index;
  next=next.slice(0,at)+replacement+next.slice(at+original.length);
 }
 fs.writeFileSync(sourceFile,next);
}
console.log(JSON.stringify({approvedAssets:planned.size,updatedAssignments:changed.length,uniqueBefore:before,uniqueAfter:after,remainingDuplicateAssignments:400-after,mode:process.argv.includes('--write')?'write':'check'},null,2));
