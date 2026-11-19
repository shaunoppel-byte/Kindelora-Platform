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
const invalidImages=[];
const undersizedImages=[];
const wrongAspectImages=[];
const missingProvenance=[];
const svgImages=[];
const remoteImages=[];
const manifest=JSON.parse(fs.readFileSync(new URL('../quality/affirmation-artwork-remediation.json',import.meta.url),'utf8'));
const approvals=new Map(manifest.entries.map(entry=>[entry.id,entry]));
if(approvals.size!==400)throw new Error('Artwork provenance manifest must contain 400 unique IDs');
function webpDimensions(bytes){
 if(bytes.length<30||bytes.toString('ascii',0,4)!=='RIFF'||bytes.toString('ascii',8,12)!=='WEBP')return null;
 const kind=bytes.toString('ascii',12,16);
 if(kind==='VP8X'&&bytes.length>=30)return {width:1+bytes.readUIntLE(24,3),height:1+bytes.readUIntLE(27,3)};
 if(kind==='VP8L'&&bytes.length>=25){const n=bytes.readUInt32LE(21);return {width:(n&16383)+1,height:((n>>>14)&16383)+1};}
 if(kind==='VP8 '&&bytes.length>=30&&bytes[23]===0x9d&&bytes[24]===0x01&&bytes[25]===0x2a)return {width:bytes.readUInt16LE(26)&16383,height:bytes.readUInt16LE(28)&16383};
 return null;
}
for(let i=0;i<ids.length;i++){
  // URL variants, width and quality parameters do not make a new photograph.
  const photo=images[i].split('?')[0].replace(/\/$/,'');
  if (!/^https?:\/\//i.test(photo)) {
    if (photo.startsWith('//') || photo.includes('..') || !photo.startsWith('/')) throw new Error('Unsafe local artwork path for '+ids[i]+': '+photo);
    if (!fs.existsSync(new URL('..'+photo,import.meta.url))) throw new Error('Missing local artwork for '+ids[i]+': '+photo);
    const bytes=fs.readFileSync(new URL('..'+photo,import.meta.url));
    const dimensions=webpDimensions(bytes);
    if(photo.toLowerCase().endsWith('.svg')){
      const svg=bytes.toString('utf8');
      const valid=svg.includes('<svg')&&svg.includes('</svg>');
      if(!valid)invalidImages.push({id:ids[i],path:photo,reason:'invalid SVG structure'});
      else svgImages.push({id:ids[i],path:photo,reason:'SVG requires independent editorial and visual review; not a verified premium photograph'});
    } else if(!dimensions)invalidImages.push({id:ids[i],path:photo,reason:'not a supported valid WebP header'});
    else {
      if(dimensions.width<900||dimensions.height<1200)undersizedImages.push({id:ids[i],path:photo,...dimensions});
      const aspect=dimensions.width/dimensions.height;
      if(aspect<0.70||aspect>0.80)wrongAspectImages.push({id:ids[i],path:photo,...dimensions,aspect:+aspect.toFixed(3)});
    }
    const digest=crypto.createHash('sha256').update(bytes).digest('hex');
    const hashGroup=contentHashes.get(digest)||[];
    hashGroup.push({id:ids[i],path:photo});
    contentHashes.set(digest,hashGroup);
  }
  if(photo.startsWith('https://')||photo.startsWith('http://'))remoteImages.push({id:ids[i],url:photo,reason:'remote asset availability, licensing, dimensions and visual uniqueness not verified offline'});
  const record=approvals.get(ids[i]);
  if(!record||record.replacementAsset!==photo||!record.licenseEvidence?.trim()||record.qaStatus!=='approved')missingProvenance.push({id:ids[i],path:photo,reason:!record?'missing manifest entry':record.replacementAsset!==photo?'asset mapping differs':!record.licenseEvidence?.trim()?'missing license/provenance evidence':'not approved'});
  const entries=groups.get(photo)||[];
  entries.push({id:ids[i],title:titles[i]});
  groups.set(photo,entries);
}
const repeatedFiles=[...contentHashes].filter(([,items])=>items.length>1);
const duplicates=[...groups].filter(([,entries])=>entries.length>1).sort((a,b)=>b[1].length-a[1].length);
const report={affirmations:ids.length,uniqueUnderlyingImages:groups.size,duplicateAssignments:ids.length-groups.size,duplicateImageGroups:duplicates.length,identicalBinaryGroups:repeatedFiles.length,invalidLocalAssets:invalidImages.length,svgRequiringVisualReview:svgImages.length,remoteRequiringVerification:remoteImages.length,belowPremiumPortraitMinimum:undersizedImages.length,wrongPortraitAspect:wrongAspectImages.length,unapprovedOrUnprovenanced:missingProvenance.length,invalidImageDetails:invalidImages,svgReviewDetails:svgImages,remoteReviewDetails:remoteImages,undersizedImageDetails:undersizedImages,wrongAspectDetails:wrongAspectImages,provenanceDetails:missingProvenance,identicalBinaryAssignments:repeatedFiles.reduce((n,[,items])=>n+items.length-1,0),identicalBinaryDetails:repeatedFiles.map(([sha256,items])=>({sha256,items})),groups:duplicates.map(([url,entries])=>({url,count:entries.length,entries}))};
const reportText=JSON.stringify(report,null,2)+'\n';
if(process.env.ARTWORK_AUDIT_REPORT_PATH)fs.writeFileSync(process.env.ARTWORK_AUDIT_REPORT_PATH,reportText);
console.log(reportText);
if(duplicates.length||repeatedFiles.length||invalidImages.length||undersizedImages.length||wrongAspectImages.length||missingProvenance.length||svgImages.length||remoteImages.length){console.error('Artwork QA FAIL: duplicate, invalid, undersized, wrong-aspect, unapproved or unprovenanced artwork. Do not release.');process.exitCode=1;}
