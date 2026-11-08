#!/usr/bin/env node
// Advisory: distinguish unique SVG filenames from recurring illustration structures.
// Usage: node scripts/audit-svg-visual-families.mjs
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(root,'affirmation-library.js'),'utf8');
const block=source.slice(source.indexOf('const items=['),source.indexOf('];',source.indexOf('const items=[')));
const get=k=>[...block.matchAll(new RegExp('\\b'+k+':\\s*([\\x22\\x27])([\\s\\S]*?)\\1','g'))].map(m=>m[2]);
const ids=get('id'),images=get('image');
if(ids.length!==images.length||ids.length!==400)throw Error('Unexpected catalogue length or field mismatch');
const families=new Map();
let localSvg=0,remote=0,other=0;
for(let i=0;i<ids.length;i++){
 const url=images[i].split('?')[0];
 if(/^https?:\/\//.test(url)){remote++;continue;}
 if(!url.endsWith('.svg')){other++;continue;}
 const filename=path.resolve(root,'.'+url);
 if(!filename.startsWith(root+path.sep)||!fs.existsSync(filename))throw Error('Missing or unsafe asset: '+url);
 const svg=fs.readFileSync(filename,'utf8');
 // Structural signature deliberately ignores colours, positions, numeric coordinates,
 // title and accessibility text; those changes alone do not establish a new composition.
 const signature=[...svg.matchAll(/<\s*(rect|circle|ellipse|path|polygon|polyline|line|linearGradient|radialGradient|filter|image)\b/gi)].map(m=>m[1].toLowerCase()).join('/');
 const entry={id:ids[i],image:url};
 const group=families.get(signature)||[];
 group.push(entry);families.set(signature,group);localSvg++;
}
const repeated=[...families.values()].filter(g=>g.length>1).sort((a,b)=>b.length-a.length);
const report={cards:ids.length,localSvg,remote,other,structuralFamilies:families.size,repeatedFamilies:repeated.length,cardsInRepeatedFamilies:repeated.reduce((n,g)=>n+g.length,0),groups:repeated.map(g=>({count:g.length,ids:g.map(x=>x.id),images:g.map(x=>x.image)})),note:'Advisory only: structural resemblance is a risk signal, not a pixel/perceptual similarity score or founder visual approval.'};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--fail-on-repetition')&&repeated.length)process.exitCode=1;
