// Shared KINDELORA session checks. A verified login is not a Plus entitlement.
export const reply=(body,status=200,extra={})=>new Response(JSON.stringify(body),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store","x-content-type-options":"nosniff",...extra}});
export const ready=env=>env?.MEMBER_AUTH_ENABLED==="true"&&!!env.DB&&typeof env.MEMBER_AUTH_PEPPER==="string"&&env.MEMBER_AUTH_PEPPER.length>=32;
export const hash=async text=>Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text))),x=>x.toString(16).padStart(2,"0")).join("");
export const random=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,"0")).join("");
export const tokenFrom=req=>(req.headers.get("cookie")||"").split(";").map(x=>x.trim()).find(x=>x.startsWith("kindelora_session="))?.slice(18)||"";
export const originOK=req=>req.headers.get("origin")===new URL(req.url).origin;
export const cookie=token=>"kindelora_session="+token+"; Path=/api/member; Secure; HttpOnly; SameSite=Strict; Max-Age=604800";
export const clearCookie="kindelora_session=; Path=/api/member; Secure; HttpOnly; SameSite=Strict; Max-Age=0";
export async function member(req,env){
 const token=tokenFrom(req);
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 return env.DB.prepare("SELECT m.id,m.email_normalized,m.email_verified_at FROM member_sessions s JOIN members m ON m.id=s.member_id WHERE s.token_hash=? AND s.expires_at>? AND m.disabled_at IS NULL AND m.email_verified_at IS NOT NULL").bind(await hash(token+env.MEMBER_AUTH_PEPPER),new Date().toISOString()).first();
}
