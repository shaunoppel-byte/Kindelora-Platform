import assert from 'node:assert/strict';
import {consumeEmailVerification} from '../functions/_lib/member-email-verification-d1.js';
import {verificationTokenHash} from '../functions/_lib/member-email-verification.js';
const token='a'.repeat(64),pepper='p'.repeat(40),now='2026-11-19T12:00:00Z',hash=await verificationTokenHash(token,pepper);
function dbFixture({email='person@example.com',expiry='2026-11-19T12:05:00Z',consumed=null,changes=1}={}){
 let updateCalls=0;return {get updateCalls(){return updateCalls},prepare(sql){return {bind(...args){return {async first(){assert.match(sql,/SELECT email_normalized/);assert.equal(args[0],hash);return {email_normalized:email,expires_at:expiry,consumed_at:consumed}},async run(){assert.match(sql,/consumed_at IS NULL AND expires_at>/);assert.equal(args[1],hash);updateCalls++;return {meta:{changes}}}}}}}};
}
const base={token,pepper,email:'Person@Example.com',now};
let db=dbFixture();assert.deepEqual(await consumeEmailVerification({...base,db}),{verified:true,email:'person@example.com'});assert.equal(db.updateCalls,1);
for(const options of [{email:'attacker@example.com'},{expiry:'2026-11-19T12:00:00Z'},{consumed:'2026-11-19T11:00:00Z'}]){db=dbFixture(options);assert.equal((await consumeEmailVerification({...base,db})).verified,false);assert.equal(db.updateCalls,0)}
db=dbFixture({changes:0});assert.equal((await consumeEmailVerification({...base,db})).verified,false);
assert.equal((await consumeEmailVerification({...base,db:null})).verified,false);
assert.equal((await consumeEmailVerification({...base,db:dbFixture(),token:'invalid'})).verified,false);
console.log('PASS: D1 email verification denies wrong email, expired/replayed tokens and concurrent losing updates');
