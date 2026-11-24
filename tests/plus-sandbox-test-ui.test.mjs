import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../plus-sandbox-test.js',import.meta.url),'utf8');
function harness(response){
 const nodes=new Map(), calls=[], forms=[];
 function node(){return {style:{},children:[],setAttribute(){},addEventListener(k,fn){this[k]=fn},appendChild(n){this.children.push(n)},submit(){forms.push(this)}}}
 const document={getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},createElement:node,body:node()};
 vm.runInNewContext(source,{document,fetch:async(url,opts)=>{calls.push({url,opts});return response}});
 return {nodes,calls,forms};
}
const fields={merchant_id:'10000100',merchant_key:'test-key',m_payment_id:'test-ref',amount:'100.00',signature:'test-signature'};
const response=(action='https://sandbox.payfast.co.za/eng/process',environment='sandbox')=>({ok:true,json:async()=>({ok:true,environment,checkoutReady:false,redirect:{action,method:'POST',fields}})});
for(const plan of ['monthly','annual'])test('sandbox handoff '+plan,async()=>{const h=harness(response());h.nodes.get(plan).click();await h.nodes.get('checkout-submit').click();assert.equal(h.calls[0].url,'/api/plus/sandbox-checkout');assert.equal(JSON.parse(h.calls[0].opts.body).plan,plan);assert.equal(h.forms.length,1);assert.equal(h.forms[0].action,'https://sandbox.payfast.co.za/eng/process');});
test('reject live destination and wrong environment',async()=>{for(const r of [response('https://www.payfast.co.za/eng/process'),response(undefined,'live')]){const h=harness(r);await h.nodes.get('checkout-submit').click();assert.equal(h.forms.length,0);}});
test('fail closed on 401 and 503',async()=>{for(const status of [401,503]){const h=harness({ok:false,status});await h.nodes.get('checkout-submit').click();assert.equal(h.forms.length,0);assert.equal(h.nodes.get('checkout-submit').disabled,false);}});
