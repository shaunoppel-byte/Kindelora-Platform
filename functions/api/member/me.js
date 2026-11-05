// KINDELORA member session verification. No client-controlled membership grants.
// Deliberately fail closed until secure login issuance and D1 are deployed.
export async function onRequestGet({request,env}) {
  const headers={"content-type":"application/json; charset=utf-8","cache-control":"no-store"};
  if(env?.MEMBER_AUTH_ENABLED!=="true"||!env?.DB||!env?.MEMBER_AUTH_PEPPER) {
    return new Response(JSON.stringify({authenticated:false,reason:"member_auth_not_configured"}),{status:503,headers});
  }
  const raw=(request.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("kindelora_session="));
  const token=raw?.slice("kindelora_session=".length)||"";
  if(!/^[a-f0-9]{64}$/.test(token))return new Response(JSON.stringify({authenticated:false}),{status:401,headers});
  const bytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(token+env.MEMBER_AUTH_PEPPER));
  const hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("");
  const session=await env.DB.prepare("SELECT m.id, m.email_normalized, m.email_verified_at FROM member_sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=? AND s.expires_at > ? AND m.disabled_at IS NULL").bind(hash,new Date().toISOString()).first();
  if(!session)return new Response(JSON.stringify({authenticated:false}),{status:401,headers});
  return new Response(JSON.stringify({authenticated:true,member:{id:session.id,email:session.email_normalized,verified:!!session.email_verified_at}}),{status:200,headers});
}
