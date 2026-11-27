import assert from "node:assert/strict";
import {webcrypto} from "node:crypto";
import {onRequest} from "../functions/api/member/favourites.js";
globalThis.crypto ||= webcrypto;
const pepper="test-pepper-".repeat(4);
const token="a".repeat(64);
const hash=Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token+pepper))),b=>b.toString(16).padStart(2,"0")).join("");
let paid=true, writes=0;
const items=new Map();
const DB={prepare(sql){return {bind(...args){return {
 async first(){
 if(sql.includes("FROM member_sessions"))return args[0]===hash?{id:"member-a"}:null;
 if(sql.includes("FROM plus_subscriptions"))return {entitled:paid?1:0};
 if(sql.includes("SELECT 1 AS saved"))return items.has(JSON.stringify(args))?{saved:1}:null;
 throw Error(sql);
 },
 async all(){assert.equal(args[0],"member-a");return {results:[...items.values()]};},
 async run(){writes++;assert.equal(args[0],"member-a");if(sql.startsWith("INSERT")){assert.equal(args[4],"member-a");items.set(JSON.stringify(args.slice(0,3)),{kind:args[1],content:args[2]});}else if(sql.startsWith("DELETE"))items.delete(JSON.stringify(args));else throw Error(sql);return {success:true};}
 };}}}};
const env={DB,MEMBER_AUTH_ENABLED:"true",MEMBER_AUTH_PEPPER:pepper,MEMBER_FAVOURITES_ENABLED:"true"};
const call=(method="GET",body,opts={})=>onRequest({env:{...env,...opts.env},request:new Request("https://kindelora.pages.dev/api/member/favourites",{method,headers:{cookie:opts.guest?"":"kindelora_session="+token,origin:opts.origin||"https://kindelora.pages.dev","content-type":"application/json"},...(body===undefined?{}:{body:JSON.stringify(body)})})});
assert.equal((await call("GET",undefined,{env:{MEMBER_FAVOURITES_ENABLED:"false"}})).status,503);
assert.equal((await call("GET",undefined,{guest:true})).status,401);
paid=false;assert.equal((await call("POST",{kind:"messages",content:"test"})).status,403);paid=true;
assert.equal((await call("POST",{kind:"messages",content:"test"},{origin:"https://other.example"})).status,403);
assert.equal((await call("POST",{kind:"invalid",content:"test"})).status,400);
assert.equal(writes,0);
const item={kind:"messages",content:"test",memberId:"member-b"};
assert.equal((await call("POST",item)).status,200);
assert.equal((await call("POST",item)).status,200);
const list=await call();assert.equal(list.headers.get("cache-control"),"no-store");assert.deepEqual((await list.json()).items,[{kind:"messages",content:"test"}]);
assert.equal((await call("DELETE",item)).status,200);
assert.deepEqual((await (await call()).json()).items,[]);
console.log("PASS: default disabled, guest and unpaid denied, cross-origin denied, identity scoped, save/list/delete and duplicate handling (mock D1)");
