import assert from 'node:assert/strict';
import {onRequestGet} from '../functions/api/plus/sandbox-order-status.js';
const request=new Request('https://kindelora.pages.dev/api/plus/sandbox-order-status?reference=order_12345678');
let result=await onRequestGet({request,env:{}});assert.equal(result.status,503);
assert.equal((await result.json()).plusActive,false);
console.log('PASS: sandbox order status fails closed without verified member session');
