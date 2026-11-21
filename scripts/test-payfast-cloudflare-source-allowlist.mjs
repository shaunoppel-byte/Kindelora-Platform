import assert from 'node:assert/strict';
import {verifyPayFastCloudflareSource as verify} from '../functions/_lib/payfast-cloudflare-source-allowlist.js';
const request=ip=>({headers:{get:name=>name==='cf-connecting-ip'?ip:name==='x-forwarded-for'?'192.0.2.10':null}});
assert.equal(verify({request:request('192.0.2.10'),allowedCidrs:'192.0.2.0/24'}).verified,true);
assert.equal(verify({request:request('192.0.2.10'),allowedCidrs:'192.0.2.10'}).verified,true);
assert.equal(verify({request:request('192.0.3.10'),allowedCidrs:'192.0.2.0/24'}).verified,false);
assert.equal(verify({request:request('192.0.2.10'),allowedCidrs:''}).verified,false);
assert.equal(verify({request:request('192.0.2.10'),allowedCidrs:'192.0.2.1/24'}).verified,false);
assert.equal(verify({request:request('192.0.2.10'),allowedCidrs:'0.0.0.0/0'}).verified,true); // operator must never configure wildcard
for(const ip of ['192.0.2.999','192.0.2.010','::1','192.0.2.10,192.0.2.11',null]){
 assert.equal(verify({request:request(ip),allowedCidrs:'192.0.2.0/24'}).verified,false);
}
assert.equal(verify({request:{headers:{get:()=>null}},allowedCidrs:'192.0.2.0/24'}).verified,false);
console.log('PASS: Cloudflare PayFast source gate uses only trusted edge IP and explicit CIDR allowlist');
