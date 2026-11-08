#!/usr/bin/env node
/* No-dependency regression contract for the film-aligned public journey.
   Checks source contracts; does not replace browser, visual or auth testing. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const read=p=>fs.readFileSync(p,'utf8');
const welcome=read('welcome.html');
const homepage=read('index.html');
const library=read('affirmation-library.html');
const css=read('cinematic-brand.css');
const failures=[];
function check(name,fn){try{fn();console.log('PASS',name)}catch(e){failures.push(name+': '+e.message);console.error('FAIL',name,e.message)}}
check('welcome has accessible document language and mobile viewport',()=>{assert.match(welcome,/<html lang="en">/);assert.match(welcome,/name="viewport"/);assert.match(welcome,/<main\b/);assert.match(welcome,/<h1\b/);});
check('welcome includes real guest and preview paths',()=>{assert.match(welcome,/href="\/#daily"/);assert.match(welcome,/href="\/#plus-checkout-panel"/);assert.match(welcome,/href="\/affirmation-library\.html"/);assert.match(welcome,/No sign-in needed/);assert.match(welcome,/Secure signup and paid access are not available yet/);});
check('welcome path destinations exist on homepage',()=>{assert.match(homepage,/id="daily"/);assert.match(homepage,/id="plus-checkout-panel"/);});
check('library and homepage have a route to welcome',()=>{assert.match(homepage,/href="\/welcome\.html"/);assert.match(library,/href="\/welcome\.html"/);});
check('all cinematic surfaces load shared brand tokens',()=>{for(const [name,html] of [['welcome',welcome],['homepage',homepage],['library',library]])assert.match(html,/href="\/cinematic-brand\.css"/,name);for(const token of ['--kc-velvet','--kc-champagne','--kc-ivory'])assert.ok(css.includes(token),token);});
check('cinematic elements honor reduced-motion preference',()=>{assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/);assert.match(css,/animation:none!important/);});
check('visible keyboard focus style for welcome CTAs',()=>assert.match(css,/\.kc-button:focus-visible/));
check('mobile welcome pathways become single column',()=>assert.match(css,/\.kc-pathways\s*\{grid-template-columns:1fr/));
check('Plus remains a preview with no fake sign-in',()=>{assert.match(homepage,/Plan preview · No charges/);assert.match(homepage,/Secure signup and email verification will be offered before checkout once fully tested/);assert.doesNotMatch(welcome,/<input[^>]+type="password"/i);});
check('no autoplay or fake payment on welcome',()=>{assert.doesNotMatch(welcome,/autoplay|<form\b|checkout\/pay/i);});
if(failures.length){console.error('\n'+failures.length+' cinematic contract checks failed');process.exitCode=1}else console.log('\n10 cinematic journey source-contract checks passed; browser/visual QA remains separate.');
