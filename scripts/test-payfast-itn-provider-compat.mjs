import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyItnSignature} from '../functions/_lib/payfast-itn-signature.js';
import {canonicalItnPayload} from '../functions/_lib/payfast-itn-canonical.js';
const subtle={digest:async(_,bytes)=>createHash('md5').update(Buffer.from(bytes)).digest().buffer.slice(0)};
function fixture(passphrase='offline secret'){
 const form=new URLSearchParams('merchant_id=10000100&m_payment_id=order_123&payment_status=COMPLETE&amount_gross=199.99&signature=00000000000000000000000000000000');
 form.set('signature',createHash('md5').update(canonicalItnPayload(form,passphrase)).digest('hex'));
 return form;
}
test('valid signed ITN is accepted',async()=>{
 const f=fixture();
 const digest={digest:async(_,bytes)=>Uint8Array.from(createHash('md5').update(Buffer.from(bytes)).digest()).buffer};
 assert.equal(await verifyItnSignature(f,'offline secret',digest),true);
});
test('fail closed if signature, amount or passphrase changes',async()=>{
 const digest={digest:async(_,bytes)=>Uint8Array.from(createHash('md5').update(Buffer.from(bytes)).digest()).buffer};
 const f=fixture();f.set('amount_gross','200.00');
 assert.equal(await verifyItnSignature(f,'offline secret',digest),false);
 assert.equal(await verifyItnSignature(f,'wrong passphrase',digest),false);
 const dup=fixture();dup.append('signature',dup.get('signature'));
 assert.equal(await verifyItnSignature(dup,'offline secret',digest),false);
});
