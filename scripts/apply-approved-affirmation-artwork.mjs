#!/usr/bin/env node
// KINDELORA: apply ONLY fully approved artwork assignments to a catalogue.
// Usage: node scripts/apply-approved-affirmation-artwork.mjs --check
//        node scripts/apply-approved-affirmation-artwork.mjs --write
// The source catalogue is never modified unless every entry passes validation.
import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(fs.readFileSync(new URL('quality/affirmation-artwork-remediation.json',root),'utf8'));
const sourceUrl=new URL('affirmation-library.js',root);
const source=fs.readFileSync(sourceUrl,'utf8');
const start=source.indexOf('const items=['),end=source.indexOf('];',start);
if(start<0||end<0)throw Error('Catalogue not found');
const section=source.slice(start,end);
const entries=[...section.matchAll(/\{id:(['"])(.*?)\1,title:(['"])(.*?)\3,text:(['"])(.*?)\5,tags:(['"])(.*?)\7,image:(['"])(.*?)\9\}/g)];
const approved=new Map(manifest.entries.map(e=>[e.id,e]));
const errors=[];
if(entries.length!==400)errors.push('Expected 400 catalogue entries; got '+entries.length);
if(approved.size!==400)errors.push('Expected 400 unique manifest IDs');
const urls=new Set();
const replacements=new Map();
for(const match of entries){
 const id=match[2],current=match[10],item=approved.get(id);
 if(!item){errors.push(id+': missing manifest record');continue}
 const target=(item.replacementAsset||'').trim();
 const approvedStatus=item.qaStatus==='approved';
 const license=(item.licenseEvidence||'').trim();
 if(!target||!approvedStatus||!license){errors.push(id+': requires approved replacement asset, licensing evidence and QA sign-off');continue}
 // Same-origin immutable local assets or explicit HTTPS media; reject remote randomizers.
 if(!(/^(\/assets\/affirmations\/[a-zA-Z0-9_./-]+\.(?:webp|avif|jpg|jpeg|png))$/.test(target)||/^https:\/\//.test(target)))errors.push(id+': invalid asset URL');
 if(/(?:source\.unsplash\.com|picsum\.photos|\/random(?:\/|\?))/.test(target))errors.push(id+': random image endpoint forbidden');
 const identity=target.split('?')[0].replace(/\/$/,'');
 if(urls.has(identity))errors.push(id+': duplicate underlying artwork '+identity);
 urls.add(identity);
 if(target===current&&item.needsReplacement)errors.push(id+': flagged repeat not replaced');
 if(target.startsWith('/')){
  const file=new URL('.'+target,root);
  if(!fs.existsSync(file))errors.push(id+': local asset missing '+target);
 }
 replacements.set(id,target);
}
if(errors.length){console.error('Artwork release BLOCKED: '+errors.length+' validation issue(s).\n'+errors.slice(0,24).join('\n'));process.exit(1)}
let next=source;
for(const match of [...entries].reverse()){
 const old=match[0],replacement=old.replace(/image:(['"])(.*?)\1/,(_,quote)=>'image:'+quote+replacements.get(match[2])+quote);
 const absolute=start+match.index;
 next=next.slice(0,absolute)+replacement+next.slice(absolute+old.length);
}
if(process.argv.includes('--write')){fs.writeFileSync(sourceUrl,next);console.log('Applied 400 approved unique artwork assets');}
else console.log('PASS: 400 approved, licensed, unique assets are ready; use --write to apply');
