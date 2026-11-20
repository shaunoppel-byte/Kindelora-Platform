import {reply,ready} from './_auth.js';
// Public readiness must fail closed if the actual D1 schema is not compatible.
// Return only a boolean and public Turnstile site key, never table names, SQL or secrets.
export async function onRequestGet({env}){
 const configured=env?.PUBLIC_REGISTRATION_ENABLED==='true'&&ready(env)&&
 typeof env?.TURNSTILE_SECRET_KEY==='string'&&env.TURNSTILE_SECRET_KEY.length>0&&
 typeof env?.TURNSTILE_SITE_KEY==='string'&&/^[a-zA-Z0-9_-]{8,128}$/.test(env.TURNSTILE_SITE_KEY)&&
 typeof env?.RESEND_API_KEY==='string'&&env.RESEND_API_KEY.startsWith('re_')&&
 typeof env?.REGISTRATION_FROM_EMAIL==='string'&&env.REGISTRATION_FROM_EMAIL.includes('@');
 if(!configured)return reply({available:false});
 try {
  // Read-only, zero-row selects ensure production tables and required columns exist.
  // The query planner still resolves referenced column names on empty tables.
  await env.DB.batch([
   env.DB.prepare('SELECT id,email_normalized,password_salt,password_hash,email_verified_at FROM members LIMIT 0'),
   env.DB.prepare('SELECT token_hash,email_normalized,password_salt,password_hash,expires_at,consumed_at,consumed_nonce FROM member_email_verifications LIMIT 0'),
   env.DB.prepare('SELECT key_hash,attempts,window_started_at,blocked_until FROM member_registration_limits LIMIT 0')
  ]);
 } catch {
  console.info('member_registration_readiness','schema_unavailable');
  return reply({available:false});
 }
 return reply({available:true,turnstileSiteKey:env.TURNSTILE_SITE_KEY});
}
