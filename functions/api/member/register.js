import {reply,ready,hash,random,originOK} from "./_auth.js";
export async function onRequestPost({request,env}){
 if(!ready(env))return reply({error:"Member registration is not configured"},503);
 if(!originOK(request))return reply({error:"Invalid origin"},403);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return reply({error:"JSON required"},415);
 let data;try{data=await request.json()}catch{return reply({error:"Invalid request"},400);}
 const email=typeof data.email==="string"?data.email.trim().toLowerCase():"";
 const password=data.password,invitation=data.invitation;
 if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=="string"||password.length<12||password.length>256||typeof invitation!=="string"||!/^[a-f0-9]{64}$/.test(invitation))return reply({error:"Invalid registration details"},400);
 const inviteHash=await hash(invitation+env.MEMBER_AUTH_PEPPER),now=new Date().toISOString();
 const valid=await env.DB.prepare("SELECT email_normalized FROM member_invitations WHERE token_hash=? AND expires_at>? AND consumed_at IS NULL").bind(inviteHash,now).first();
 if(!valid||valid.email_normalized!==email)return reply({error:"Invalid or expired invitation"},403);
 const salt=random(),key=await crypto.subtle.importKey("raw",new TextEncoder().encode(password),"PBKDF2",false,["deriveBits"]);
 const passwordHash=Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:new TextEncoder().encode(salt),iterations:310000,hash:"SHA-256"},key,256)),x=>x.toString(16).padStart(2,"0")).join("");
 const id=crypto.randomUUID();
 // D1 batch is atomic; consuming a verified, single-use invitation creates the account.
 try{
  await env.DB.batch([
   env.DB.prepare("UPDATE member_invitations SET consumed_at=? WHERE token_hash=? AND consumed_at IS NULL").bind(now,inviteHash),
   env.DB.prepare("INSERT INTO members(id,email_normalized,password_salt,password_hash,email_verified_at) VALUES(?,?,?,?,?)").bind(id,email,salt,passwordHash,now)
  ]);
 }catch{return reply({error:"Registration unavailable or invitation already used"},409);}
 return reply({registered:true,signInRequired:true},201);
}
