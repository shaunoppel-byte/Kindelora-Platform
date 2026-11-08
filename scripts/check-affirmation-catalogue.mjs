#!/usr/bin/env node
// Blocking integrity check independent of the ongoing artwork-uniqueness audit.
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../affirmation-library.js',import.meta.url),'utf8');
const start=source.indexOf('const items=['),end=source.indexOf('];',start);
if(start<0||end<0)throw Error('Affirmation catalogue missing');
const data=source.slice(start,end);
const get=key=>[...data.matchAll(new RegExp('\\b'+key+':\\s*([\\x22\\x27])([^\\x22\\x27]*?)\\1','g'))].map(x=>x[2]);
const ids=get('id'),texts=get('text'),images=get('image'),titles=get('title');
const repeated=ids.filter((id,i)=>ids.indexOf(id)!==i);
const errors=[];
if(ids.length!==400)errors.push('Expected exactly 400 cards, found '+ids.length);
if(new Set(ids).size!==400)errors.push('Duplicate IDs: '+[...new Set(repeated)].join(', '));
for(const [name,values] of Object.entries({texts,images,titles}))if(values.length!==ids.length)errors.push('Mismatched '+name+' fields: '+values.length);
for(let i=0;i<ids.length;i++)if(!ids[i]?.trim()||!texts[i]?.trim()||!images[i]?.trim())errors.push('Empty required field at card '+i);
console.log(JSON.stringify({cards:ids.length,uniqueIds:new Set(ids).size,uniqueImages:new Set(images.map(x=>x.split('?')[0])).size,errors},null,2));
if(errors.length)process.exitCode=1;
