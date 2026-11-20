import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {webcrypto} from 'node:crypto';
import {canonicalItnPayload} from '../functions/_lib/payfast-itn-canonical.js';
import {verifyItnSignature} from '../functions/_lib/payfast-itn-signature.js';
test('accepts correct MD5 signature and rejects tampering, wrong passphrase and duplicates',async()=>{
 const params=new URLSearchParams('merchant_id=10000100&m_payment_id=order-123&amount_gross=199.99&payment_status=COMPLETE&signature=00000000000000000000000000000000');
 const signed=canonicalItnPayload(params,'offline secret');
 const signature=createHash('md5').update(signed).digest('hex');
 params.set('signature',signature);
 const subtle={digest:async(_,bytes)=>Uint8Array.from(Buffer.from(createHash('md5').update(Buffer.from(bytes)).digest('hex'),'hex')).buffer};
 assert.equal(await verifyItnSignature(params,'offline secret',subtle),true);
 assert.equal(await verifyItnSignature(params,'wrong secret',subtle),false);
 const tampered=new URLSearchParams(params);tampered.set('amount_gross','299.99');
 assert.equal(await verifyItnSignature(tampered,'offline secret',subtle),false);
 const duplicate=new URLSearchParams(params);duplicate.append('merchant_id','10000100');
 assert.equal(await verifyItnSignature(duplicate,'offline secret',subtle),false);
});
test('fails closed for missing and malformed signature',async()=>{
 assert.equal(await verifyItnSignature(new URLSearchParams('merchant_id=10000100'),'secret'),false);
 assert.equal(await verifyItnSignature(new URLSearchParams('signature=bad'),'secret'),false);
});
