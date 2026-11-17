#!/usr/bin/env node
// Read-only editorial release evidence report; never upgrades QA status.
import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync(new URL('../quality/affirmation-artwork-remediation.json',import.meta.url),'utf8'));
const source=fs.readFileSync(new URL('../affirmation-library.js',import.meta.url),'utf8');
const start=source.indexOf('const items=['),end=source.indexOf('];',start);
if(start<0||end<0)throw Error('Catalogue missing');
const body=source.slice(start,end);
const get=k=>[...body.matchAll(new RegExp('\\b'+k+':\\s*([\\x22\\x27])([\\s\\S]*?)\\1','g'))].map(x=>x[2]);
const ids=get('id'),images=get('image'),entries=manifest.entries||[];
const failures=[];
const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
assert(ids.length===400&&images.length===400,'Expected 400 catalogue items and image paths');
assert(entries.length===400,'Expected 400 manifest entries');
assert(new Set(ids).size===ids.length,'Duplicate catalogue IDs');
assert(new Set(images).size===images.length,'Duplicate image assignments');
const byId=new Map(entries.map(e=>[e.id,e]));
assert(byId.size===entries.length,'Duplicate manifest IDs');
let pathsAligned=0,unassignedPaths=0,approved=0,pending=0,unverified=0;
for(let i=0;i<ids.length;i++){
 const e=byId.get(ids[i]);
 if(!e){failures.push('Missing manifest entry: '+ids[i]);continue;}
 if(!e.replacementAsset)unassignedPaths++;
 else if(e.replacementAsset===images[i])pathsAligned++;
 else failures.push('Manifest/image mismatch: '+ids[i]);
 if(e.qaStatus==='approved')approved++;else pending++;
 if(!e.licenseEvidence||!e.licenseEvidence.trim())unverified++;
}
const report={catalogueCount:ids.length,manifestCount:entries.length,uniqueImagePaths:new Set(images).size,pathsAligned,unassignedManifestPaths:unassignedPaths,manifestHistoricalRequiredReplacements:manifest.requiredReplacements,editorialApproved:approved,editorialNotApproved:pending,missingProvenanceRecords:unverified,releaseReady:failures.length===0&&unassignedPaths===0&&approved===400&&unverified===0,integrityPassed:failures.length===0,failures};
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
// Pending human artwork review is explicitly reported, not silently treated as approved.
