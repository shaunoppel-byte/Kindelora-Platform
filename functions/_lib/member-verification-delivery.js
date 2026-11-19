// Server-only transactional email delivery for public registration.
// Fail closed until a verified Resend sender and encrypted Cloudflare secret exist.
export async function sendRegistrationVerification(env,{email,token,origin}={}){
 if(env?.PUBLIC_REGISTRATION_ENABLED!=='true'||typeof env?.RESEND_API_KEY!=='string'||!env.RESEND_API_KEY.startsWith('re_')||typeof env?.REGISTRATION_FROM_EMAIL!=='string')throw Error('Verification email is not configured');
 if(typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw Error('Invalid verification request');
 if(origin!=='https://kindelora.pages.dev')throw Error('Untrusted verification origin');
 const url=origin+'/plus-account.html?verify='+encodeURIComponent(token);
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.REGISTRATION_FROM_EMAIL,to:[email],subject:'Verify your KINDELORA email',text:'Welcome to KINDELORA. Verify your email within 15 minutes: '+url+'\nIf you did not request this, ignore this message.'})});
 if(!response.ok)throw Error('Verification email delivery failed');
 const result=await response.json();
 if(typeof result?.id!=='string'||!result.id)throw Error('Verification email delivery not acknowledged');
 return {accepted:true};
}
