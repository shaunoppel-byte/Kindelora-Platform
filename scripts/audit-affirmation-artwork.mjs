#!/usr/bin/env node
// KINDELORA affirmation artwork audit. Run: node scripts/audit-affirmation-artwork.mjs
import fs from 'node:fs';
import crypto from 'node:crypto';
const source=fs.readFileSync(new URL('../affirmation-library.js',import.meta.url),'utf8');
const start=source.indexOf('const items=[');
const end=source.indexOf('];',start);
if(start<0||end<0)throw new Error('Affirmation catalogue not found');
const data=source.slice(start,end);
const get=(key)=>[...data.matchAll(new RegExp('\\b'+key+':\\s*([\\x22\\x27])([\\s\\S]*?)\\1','g'))].map(x=>x[2]);
const ids=get('id'),images=get('image'),titles=get('title');
if(ids.length!==images.length||ids.length!==titles.length)throw new Error('Malformed catalogue: mismatched entry fields');
const uniqueIds=new Set(ids);
if(ids.length!==400||uniqueIds.size!==400){
 const counts=new Map();for(const id of ids)counts.set(id,(counts.get(id)||0)+1);
 const repeated=[...counts].filter(([,n])=>n>1).map(([id,n])=>({id,count:n}));
 console.error(JSON.stringify({error:'Affirmation catalogue integrity failure',entries:ids.length,uniqueIds:uniqueIds.size,duplicates:repeated},null,2));
 process.exit(1);
}
const groups=new Map();
const contentHashes=new Map();
for(let i=0;i<ids.length;i++){
  // URL variants, width and quality parameters do not make a new photograph.
  const photo=images[i].split('?')[0].replace(/\/$/,'');
  if (!/^https?:\/\//i.test(photo)) {
    if (photo.startsWith('//') || photo.includes('..') || !photo.startsWith('/')) throw new Error('Unsafe local artwork path for '+ids[i]+': '+photo);
    if (!fs.existsSync(new URL('..'+photo,import.meta.url))) throw new Error('Missing local artwork for '+ids[i]+': '+photo);
    const digest=crypto.createHash('sha256').update(fs.readFileSync(new URL('..'+photo,import.meta.url))).digest('hex');
    const hashGroup=contentHashes.get(digest)||[];
    hashGroup.push({id:ids[i],path:photo});
    contentHashes.set(digest,hashGroup);
  }
  const entries=groups.get(photo)||[];
  entries.push({id:ids[i],title:titles[i]});
  groups.set(photo,entries);
}
const repeatedFiles=[...contentHashes].filter(([,items])=>items.length>1);
const duplicates=[...groups].filter(([,entries])=>entries.length>1).sort((a,b)=>b[1].length-a[1].length);
console.log(JSON.stringify({affirmations:ids.length,uniqueUnderlyingImages:groups.size,duplicateAssignments:ids.length-groups.size,duplicateImageGroups:duplicates.length,identicalBinaryGroups:repeatedFiles.length,identicalBinaryAssignments:repeatedFiles.reduce((n,[,items])=>n+items.length-1,0),identicalBinaryDetails:repeatedFiles.map(([sha256,items])=>({sha256,items})),groups:duplicates.map(([url,entries])=>({url,count:entries.length,entries}))},null,2));
if(duplicates.length||repeatedFiles.length){console.error('Artwork QA FAIL: repeated underlying photographs found. Replace with individually reviewed, licensed, theme-appropriate assets.');process.exitCode=1;}
