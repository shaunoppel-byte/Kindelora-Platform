import {reply,ready,hash,random,originOK,cookie} from "./_auth.js";
const encoder=new TextEncoder();
async function derive(password,salt){
 const key=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]);
 return Array.from(new Uint8Array(await crypto.subtle.deriveBits({name:"PBKDF2",salt:encoder.encode(salt),iterations:310000,hash:"SHA-256"},key,256)),x=>x.toString(16).padStart(2,"0")).join("");
}
function same(a,b){if(typeof a!=="string"||typeof b!=="string"||a.length!==b.length)return false;let n=0;for(let i=0;i<a.length;i++)n|=a.charCodeAt(i)^b.charCodeAt(i);return n===0;}
export async function onRequestPost({request,env}){
 if(!ready(env))return reply({error:"Member access is not configured"},503);
 if(!originOK(request))return reply({error:"Invalid origin"},403);
 if(!(request.headers.get("content-type")||"").startsWith("application/json"))return reply({error:"JSON required"},415);
 let data;try{data=await request.json()}catch{return reply({error:"Invalid JSON"},400);}
 const email=typeof data.email==="string"?data.email.trim().toLowerCase():"",password=data.password;
 if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||typeof password!=="string"||password.length>1024)return reply({error:"Invalid credentials"},401);
 const key=await hash(email+env.MEMBER_AUTH_PEPPER),now=Date.now();
 const limit=await env.DB.prepare("SELECT failures,locked_until FROM member_login_limits WHERE key_hash=?").bind(key).first();
 if(limit?.locked_until&&Date.parse(limit.locked_until)>now)return reply({error:"Too many attempts; try later"},429);
 const user=await env.DB.prepare("SELECT id,email_normalized,password_salt,password_hash,email_verified_at,disabled_at FROM members WHERE email_normalized=?").bind(email).first();
 const candidate=await derive(password,user?.password_salt||"invalid-member-placeholder");
 const valid=!!user?.email_verified_at&&!user.disabled_at&&same(candidate,user.password_hash);
 if(!valid){
  const count=(limit?.failures||0)+1,locked=count>=5?new Date(now+900000).toISOString():null;
  await env.DB.prepare("INSERT INTO member_login_limits(key_hash,failures,locked_until) VALUES(?,?,?) ON CONFLICT(key_hash) DO UPDATE SET failures=excluded.failures,locked_until=excluded.locked_until").bind(key,count,locked).run();
  return reply({error:"Invalid credentials"},401);
 }
 await env.DB.prepare("DELETE FROM member_login_limits WHERE key_hash=?").bind(key).run();
 const token=random();
 await env.DB.prepare("INSERT INTO member_sessions(token_hash,member_id,expires_at) VALUES(?,?,?)").bind(await hash(token+env.MEMBER_AUTH_PEPPER),user.id,new Date(now+604800000).toISOString()).run();
 return reply({authenticated:true,member:{id:user.id,email:user.email_normalized}},200,{"set-cookie":cookie(token)});
}
