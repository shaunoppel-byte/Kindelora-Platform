// P0 secure checkout boundary: authenticate member and validate server-owned plan.
// No PayFast merchant verification or atomic payment ledger is wired yet.
// Fail closed until verified order creation, ITN and entitlement activation exist.
import {reply,ready,member,originOK} from "../member/_auth.js";
import {resolvePlusPlan} from "../../_lib/plus-plan-contract.js";
const unavailable=()=>reply({error:"checkout_unavailable",message:"Secure checkout is not yet available. No payment was taken."},503,{"retry-after":"86400"});
export async function onRequestGet(){return unavailable()}
export async function onRequestPost({request,env}){
 if(!ready(env))return unavailable();
 if(!originOK(request))return reply({error:"invalid_origin"},403);
 let user;
 try{user=await member(request,env)}catch{return unavailable()}
 if(!user)return reply({error:"authentication_required"},401);
 const contentType=(request.headers.get("content-type")||"").split(";")[0].trim().toLowerCase();
 if(contentType!=="application/json")return reply({error:"invalid_content_type"},415);
 let raw;
 try{raw=await request.text()}catch{return reply({error:"invalid_request"},400)}
 if(raw.length>512)return reply({error:"request_too_large"},413);
 let payload;
 try{payload=JSON.parse(raw)}catch{return reply({error:"invalid_request"},400)}
 const plan=resolvePlusPlan(payload);
 if(!plan.ok)return reply({error:plan.reason},400);
 // No user-supplied price, currency or member identity is ever accepted.
 // Do NOT return a checkout URL or create entitlement until merchant/ITN verified.
 return unavailable();
}
