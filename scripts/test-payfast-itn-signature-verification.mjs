import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {md5} from '../functions/_lib/payfast-md5.js';
import {verifyPayFastItnSignature as verify} from '../functions/_lib/payfast-itn-signature-verification.js';
import {buildPayFastItnSignaturePayload as build} from '../functions/_lib/payfast-itn-signature-payload.js';
for(const input of ['', 'a','abc','message digest','abcdefghijklmnopqrstuvwxyz','Hello 世界']){
 assert.equal(md5(input),createHash('md5').update(input).digest('hex'));
}
const passphrase='merchant-only-secret';
const unsigned='merchant_id=10000100&m_payment_id=order_12345678&item_name=Hello+World&amount_gross=170.00';
const payload=build({raw:unsigned+'&signature='+('0'.repeat(32)),passphrase}).payload;
const signature=createHash('md5').update(payload).digest('hex');
const raw=unsigned+'&signature='+signature;
assert.equal(verify({raw,passphrase}).verified,true);
assert.equal(verify({raw,passphrase:'  '+passphrase+'  '}).verified,true);
assert.equal(verify({raw:raw.replace('170.00','171.00'),passphrase}).verified,false);
assert.equal(verify({raw,passphrase:'wrong'}).verified,false);
assert.equal(verify({raw,passphrase:''}).verified,false);
assert.equal(verify({raw,passphrase:'   '}).verified,false);
assert.equal(verify({raw:raw+'&merchant_id=10000100',passphrase}).verified,false);
console.log('PASS: RFC MD5 known vectors and PayFast signature matching/tampering/secret denial');
