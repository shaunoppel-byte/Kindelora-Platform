// Dormant composition: cryptographically verified identity -> server-side D1 entitlement.
// Not a route, cookie/session implementation, or checkout activation.
import {verifyTrustedJwtIdentity} from './plus-auth-jwt.js';
import {verifyPlusEntitlement} from './plus-entitlement.js';

export async function authorizePlusMembership({
  token, issuer, audience, trustedKeys, db, nowSeconds = Math.floor(Date.now()/1000)
} = {}) {
  try {
    if (!Number.isSafeInteger(nowSeconds) || nowSeconds < 0) return {entitled:false,reason:'unavailable'};
    const verifiedIdentitySubject=await verifyTrustedJwtIdentity({
      token,issuer,audience,trustedKeys,nowSeconds
    });
    if (!verifiedIdentitySubject) return {entitled:false,reason:'unauthenticated'};
    // The subject is taken only from the verified signature, never from caller input.
    const now=new Date(nowSeconds*1000).toISOString();
    return await verifyPlusEntitlement({db,verifiedIdentitySubject,now});
  } catch {
    return {entitled:false,reason:'unavailable'};
  }
}
