import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyPayFastItnSignature} from '../functions/_lib/payfast-itn-signature-verification.js';
import {canonicalPayFastItnBody} from '../functions/_lib/payfast-itn-server-validation.js';
const body='m_payment_id=order_test123&pf_payment_id=1234567&item_name=+Test+Item+&item_description=&custom_str1=&amount_gross=159.09&token=test-token&billing_date=2026-11-25';
const passphrase='synthetic-test-only';
const signature=createHash('md5').update(body+'&passphrase='+passphrase).digest('hex');
const raw=body+'&signature='+signature;
assert.equal(verifyPayFastItnSignature({raw,passphrase}).verified,true);
assert.equal(canonicalPayFastItnBody(raw),body);
for(const altered of [raw.replace('&custom_str1=',''),raw.replace('159.09','159.08'),raw.replace('+Test+Item+','Test+Item'),raw+'&extra=unsigned',raw+'&signature='+signature]){
 assert.equal(verifyPayFastItnSignature({raw:altered,passphrase}).verified,false);
}
assert.equal(canonicalPayFastItnBody(raw+'&extra=unsigned'),null);
assert.equal(verifyPayFastItnSignature({raw,passphrase:'wrong'}).verified,false);
console.log('PayFast ITN empty-field signature regression passed');
