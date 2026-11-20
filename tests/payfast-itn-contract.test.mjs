import {test} from 'node:test';import {strict as assert} from 'node:assert';import {validatePayfastItnData} from '../functions/_lib/payfast-itn-contract.mjs';
const order={id:'order_123',merchantId:'12345678',currency:'ZAR',amountMinor:16500};
const data={pf_payment_id:'123456789',payment_status:'COMPLETE',merchant_id:'12345678',m_payment_id:'order_123',amount_gross:'165.00'};
const evidence={signatureValid:true,sourceValid:true,serverConfirmed:true};
test('only verified exact amount and merchant/order match accepted',()=>{assert.equal(validatePayfastItnData(data,order,evidence).status,'verified')});
test('rejects missing any security proof',()=>{for(const key of Object.keys(evidence))assert.throws(()=>validatePayfastItnData(data,order,{...evidence,[key]:false}))});
test('rejects wrong amount, identity, status and malformed payment id',()=>{for(const bad of [{amount_gross:'165.01'},{amount_gross:'165.0'},{amount_gross:'1e3'},{merchant_id:'other'},{m_payment_id:'other'},{payment_status:'CANCELLED'},{pf_payment_id:'abc'}])assert.throws(()=>validatePayfastItnData({...data,...bad},order,evidence))});
