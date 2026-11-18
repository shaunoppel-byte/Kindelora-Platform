// Dormant JWT identity verifier for a future trusted authentication integration.
// Only RS256, pinned issuer/audience, externally provisioned trusted JWKs.
// No route, credential, Cloudflare Access configuration or checkout activation.
const encoder = new TextEncoder();
function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) throw Error('bad base64url');
  const padded = value.replace(/-/g,'+').replace(/_/g,'/') + '='.repeat((4-value.length%4)%4);
  const binary = atob(padded);
  return Uint8Array.from(binary, c=>c.charCodeAt(0));
}
function jsonSegment(value) {
  const bytes=decodeBase64Url(value);
  return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
export async function verifyTrustedJwtIdentity({token, issuer, audience, trustedKeys, nowSeconds=Math.floor(Date.now()/1000)}={}) {
  try {
    if (typeof token !== 'string' || token.length > 8192 ||
        typeof issuer !== 'string' || !issuer || typeof audience !== 'string' || !audience ||
        !Array.isArray(trustedKeys) || !Number.isSafeInteger(nowSeconds)) return null;
    const parts=token.split('.');
    if(parts.length!==3) return null;
    const [headerPart,payloadPart,signaturePart]=parts;
    const header=jsonSegment(headerPart),claims=jsonSegment(payloadPart);
    if (!header || header.alg!=='RS256' || header.typ!=='JWT' ||
        typeof header.kid!=='string' || !header.kid ||
        !claims || typeof claims.sub!=='string' || !claims.sub.trim() ||
        claims.iss!==issuer ||
        !(claims.aud===audience || (Array.isArray(claims.aud) && claims.aud.includes(audience))) ||
        !Number.isSafeInteger(claims.exp) || claims.exp<=nowSeconds ||
        !Number.isSafeInteger(claims.iat) || claims.iat>nowSeconds+60 ||
        (claims.nbf!==undefined && (!Number.isSafeInteger(claims.nbf) || claims.nbf>nowSeconds))) return null;
    const jwk=trustedKeys.find(k=>k && k.kid===header.kid && k.kty==='RSA' &&
      k.alg==='RS256' && k.use==='sig' && typeof k.n==='string' && typeof k.e==='string');
    if(!jwk) return null;
    const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const ok=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,decodeBase64Url(signaturePart),
      encoder.encode(headerPart+'.'+payloadPart));
    return ok ? claims.sub : null;
  } catch { return null; }
}
