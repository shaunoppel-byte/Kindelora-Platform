// Dormant Cloudflare Pages PLUS membership endpoint.
// Global middleware intentionally denies /api/plus/* before this handler executes.
// No public launch until auth provider, D1, merchant validation and founder GO.
import {authorizePlusMembership} from '../../_lib/plus-authorization.js';

const headers={
  'Content-Type':'application/json; charset=utf-8',
  'Cache-Control':'no-store, private',
  'X-Content-Type-Options':'nosniff',
  'X-Robots-Tag':'noindex, nofollow'
};
const deny=(status,reason)=>new Response(JSON.stringify({entitled:false,reason}),{status,headers});

export async function onRequestGet({request,env}={}) {
  // Explicit release gate; global middleware remains an independent second gate.
  if(env?.PLUS_MEMBERSHIP_ENDPOINT_ENABLED!=='true') return deny(403,'unavailable');
  if(!env?.PLUS_DB || !env?.PLUS_AUTH_ISSUER || !env?.PLUS_AUTH_AUDIENCE ||
      !env?.PLUS_AUTH_TRUSTED_JWKS) return deny(503,'unavailable');
  const authorization=request?.headers?.get('Authorization')||'';
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(authorization) || authorization.length>8200)
    return deny(401,'unauthenticated');
  let keys;
  try {
    const parsed=JSON.parse(env.PLUS_AUTH_TRUSTED_JWKS);
    if(!Array.isArray(parsed.keys) || !parsed.keys.length) return deny(503,'unavailable');
    keys=parsed.keys;
  } catch { return deny(503,'unavailable'); }
  const decision=await authorizePlusMembership({
    token:authorization.slice(7),
    issuer:env.PLUS_AUTH_ISSUER,
    audience:env.PLUS_AUTH_AUDIENCE,
    trustedKeys:keys,
    db:env.PLUS_DB
  });
  if(!decision.entitled) return deny(decision.reason==='unauthenticated'?401:403,decision.reason);
  return new Response(JSON.stringify({entitled:true}),{status:200,headers});
}
