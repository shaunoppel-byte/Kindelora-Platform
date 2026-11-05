import {reply,ready,hash,tokenFrom,originOK,clearCookie} from "./_auth.js";
export async function onRequestPost({request,env}){
 if(!ready(env))return reply({error:"Member access unavailable"},503);
 if(!originOK(request))return reply({error:"Invalid origin"},403);
 const token=tokenFrom(request);
 if(/^[a-f0-9]{64}$/.test(token))await env.DB.prepare("DELETE FROM member_sessions WHERE token_hash=?").bind(await hash(token+env.MEMBER_AUTH_PEPPER)).run();
 return reply({authenticated:false},200,{"set-cookie":clearCookie});
}
