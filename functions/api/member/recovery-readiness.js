import {reply,ready} from './_auth.js';
// Read-only recovery readiness. Never exposes secrets, email, account existence or provider responses.
// No emails sent, no tokens issued, no database writes.
const result=(available,stage)=>reply({available,stage},200,{'cache-control':'no-store'});
export async function onRequestGet({env}){
 if(env?.MEMBER_PASSWORD_RECOVERY_ENABLED!=='true')return result(false,'disabled');
 if(!ready(env)||typeof env?.RESEND_API_KEY!=='string'||!env.RESEND_API_KEY.startsWith('re_')||typeof env?.REGISTRATION_FROM_EMAIL!=='string'||!env.REGISTRATION_FROM_EMAIL.trim())return result(false,'configuration');
 try{
  await env.DB.batch([
   env.DB.prepare('SELECT token_hash,member_id,expires_at,consumed_at,consumed_nonce FROM member_password_resets LIMIT 0'),
   env.DB.prepare('SELECT key_hash,attempts,window_started_at,blocked_until FROM member_password_reset_limits LIMIT 0')
  ]);
 }catch{return result(false,'schema');}
 return result(true,'ready');
}
