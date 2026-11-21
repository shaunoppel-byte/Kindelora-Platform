// Authenticated, member-controlled preferred name. Fail closed.
const headers={'content-type':'application/json; charset=utf-8','cache-control':'no-store'};
const reply=(status,data)=>new Response(JSON.stringify(data),{status,headers});
async function identity(request,env){
 if(env?.MEMBER_AUTH_ENABLED!=='true'||!env?.DB||typeof env?.MEMBER_AUTH_PEPPER!=='string'||env.MEMBER_AUTH_PEPPER.length<32)return {error:503};
 const cookie=(request.headers.get('cookie')||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('kindelora_session='));
 const token=cookie?.slice('kindelora_session='.length)||'';
 if(!/^[a-f0-9]{64}$/.test(token))return {error:401};
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token+env.MEMBER_AUTH_PEPPER));
 const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
 const m=await env.DB.prepare('SELECT m.id FROM member_sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=? AND s.expires_at>? AND m.disabled_at IS NULL AND m.email_verified_at IS NOT NULL').bind(hash,new Date().toISOString()).first();
 return m?{id:m.id}:{error:401};
}
export async function onRequestGet({request,env}){try{const m=await identity(request,env);if(m.error)return reply(m.error,{error:'not_authenticated'});const p=await env.DB.prepare('SELECT preferred_name FROM member_preferences WHERE member_id=?').bind(m.id).first();return reply(200,{preferred_name:p?.preferred_name||null});}catch{return reply(503,{error:'preferences_unavailable'});}}
export async function onRequestPut({request,env}){try{
 const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return reply(403,{error:'invalid_origin'});
 const m=await identity(request,env);if(m.error)return reply(m.error,{error:'not_authenticated'});
 if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))return reply(415,{error:'json_required'});
 const raw=await request.text();if(raw.length>512)return reply(413,{error:'too_large'});
 let data;try{data=JSON.parse(raw)}catch{return reply(400,{error:'invalid_json'})}
 const name=typeof data?.preferred_name==='string'?data.preferred_name.trim().replace(/\s+/g,' '):'';
 if(name.length<1||name.length>40||/[<>\x00-\x1f\x7f]/.test(name))return reply(400,{error:'invalid_preferred_name'});
 await env.DB.prepare('INSERT INTO member_preferences(member_id,preferred_name,updated_at) VALUES(?,?,CURRENT_TIMESTAMP) ON CONFLICT(member_id) DO UPDATE SET preferred_name=excluded.preferred_name,updated_at=CURRENT_TIMESTAMP').bind(m.id,name).run();return reply(200,{preferred_name:name});
 }catch{return reply(503,{error:'preferences_unavailable'});}}
