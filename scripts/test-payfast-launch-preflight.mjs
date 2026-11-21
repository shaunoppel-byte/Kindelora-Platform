import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/plus/payment-preflight.js';
const req=new Request('https://kindelora.pages.dev/api/plus/payment-preflight');
const result=await onRequestGet({request:req,env:{}});
assert.equal(result.status,503);
const body=await result.json();
assert.equal(body.ready,false);
assert.equal(JSON.stringify(body).includes('PASSPHRASE'),false);
console.log('PASS: payment preflight fails closed when auth is unavailable');
