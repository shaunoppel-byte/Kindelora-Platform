// Server-side password recovery delivery, deliberately NOT connected to a public route.
// Recovery links are restricted to the production origin and the verified Resend sender.
export async function sendPasswordRecovery(env,{email,token,origin}={}){
 if(typeof env?.RESEND_API_KEY!=='string'||!env.RESEND_API_KEY.startsWith('re_')||typeof env?.REGISTRATION_FROM_EMAIL!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.REGISTRATION_FROM_EMAIL))throw Error('Recovery email is not configured');
 if(typeof email!=='string'||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))throw Error('Invalid recovery request');
 if(origin!=='https://kindelora.pages.dev')throw Error('Untrusted recovery origin');
 const url=origin+'/plus-account.html?reset='+encodeURIComponent(token);
 const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.RESEND_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({from:env.REGISTRATION_FROM_EMAIL,to:[email],subject:'Reset your KINDELORA password',text:'A password reset was requested for your KINDELORA account. This link expires in 15 minutes: '+url+'\nIf you did not request this, ignore this message. Your existing password remains unchanged.'})});
 if(!response.ok)throw Error('Recovery email delivery failed');
 const result=await response.json();
 if(typeof result?.id!=='string'||!result.id)throw Error('Recovery email delivery not acknowledged');
 return {accepted:true};
}
