#!/usr/bin/env node
// KINDELORA affirmation artwork audit. Run: node scripts/audit-affirmation-artwork.mjs
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../affirmation-library.js',import.meta.url),'utf8');
const start=source.indexOf('const items=[');
const end=source.indexOf('];',start);
if(start<0||end<0)throw new Error('Affirmation catalogue not found');
const data=source.slice(start,end);
const get=(key)=>[...data.matchAll(new RegExp('\\b'+key+':\\s*([\\x22\\x27])([^\\x22\\x27]*?)\\1','g'))].map(x=>x[2]);
const ids=get('id'),images=get('image'),titles=get('title');
if(ids.length!==images.length||ids.length!==titles.length)throw new Error('Malformed catalogue: mismatched entry fields');
const groups=new Map();
for(let i=0;i<ids.length;i++){
  // URL variants, width and quality parameters do not make a new photograph.
  const photo=images[i].split('?')[0].replace(/\/$/,'');
  const entries=groups.get(photo)||[];
  entries.push({id:ids[i],title:titles[i]});
  groups.set(photo,entries);
}
const duplicates=[...groups].filter(([,entries])=>entries.length>1).sort((a,b)=>b[1].length-a[1].length);
console.log(JSON.stringify({affirmations:ids.length,uniqueUnderlyingImages:groups.size,duplicateAssignments:ids.length-groups.size,duplicateImageGroups:duplicates.length,groups:duplicates.map(([url,entries])=>({url,count:entries.length,entries}))},null,2));
if(duplicates.length){console.error('Artwork QA FAIL: repeated underlying photographs found. Replace with individually reviewed, licensed, theme-appropriate assets.');process.exitCode=1;}
