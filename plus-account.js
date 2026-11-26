// KINDELORA account UI: real auth APIs, no mock success, no browser-side entitlement grants.
(()=>{'use strict';
const by=id=>document.getElementById(id),status=by('status'),account=by('account-state'),entitlement=by('entitlement-state'),logout=by('logout');
const say=t=>{status.textContent=t};
const loginResult=by('login-result');
const loginFeedback=t=>{if(loginResult)loginResult.textContent=t;say(t);};
const request=async(path,body)=>{const options={credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};if(body){options.method='POST';options.headers['Content-Type']='application/json';options.body=JSON.stringify(body)}const r=await fetch(path,options);let data={};try{data=await r.json()}catch{}return {code:r.status,data}};
async function refresh(){try{const r=await request('/api/member/me');if(r.code===200&&r.data.authenticated){if(!verificationToken&&!paymentReturn){window.location.replace('/member-welcome.html');return;}account.textContent='Signed in as '+r.data.member.email;logout.hidden=false;const e=await request('/api/member/entitlement');entitlement.textContent=e.code===200&&e.data.plus===true?'Verified PLUS membership active.':'PLUS membership is not active or cannot be verified.';}else{logout.hidden=true;account.textContent=r.code===503?'Account service is not configured yet.':'You are not signed in.';entitlement.textContent='PLUS access has not been verified.';}}catch{account.textContent='Account service is temporarily unavailable.';entitlement.textContent='PLUS access has not been verified.';logout.hidden=true;}}
by('login').addEventListener('submit',async e=>{e.preventDefault();const b=e.currentTarget.querySelector('button');b.disabled=true;loginFeedback('Checking sign-in…');try{const r=await request('/api/member/login',{email:by('login-email').value.trim(),password:by('login-password').value});loginFeedback(r.code===200?'Signed in successfully.':r.code===503?'Secure sign-in is temporarily unavailable (HTTP 503).':r.code===429?'Too many attempts. Please try again later.':'Sign-in unsuccessful (HTTP '+r.code+'). Please check your details.');if(r.code===200){by('login-password').value='';window.location.assign('/member-welcome.html');return}}catch{loginFeedback('Sign-in service could not be reached.')}finally{b.disabled=false}});
logout.addEventListener('click',async()=>{try{const r=await request('/api/member/logout',{});say(r.code===200?'Signed out.':'Sign-out could not be confirmed.')}catch{say('Sign-out could not be confirmed.')}await refresh()});
// Registration remains disabled until server readiness is explicitly confirmed.
// The public site key is safe to expose; never expose the Turnstile secret.
let registrationWidget=null;
const registerForm=by('register'),registerButton=by('registration-submit');
const turnstileBox=by('registration-turnstile');
const registrationStatus=by('registration-status');
const registrationResult=by('registration-result');
const registrationFeedback=t=>{if(registrationResult)registrationResult.textContent=t;};
const registrationMessage=t=>{if(registrationStatus)registrationStatus.textContent=t;};
async function initRegistration(){
 registrationMessage('Checking registration availability…');
 try{
  const config=await request('/api/member/registration-config');
  const siteKey=config.data?.turnstileSiteKey;
  if(config.code!==200||config.data?.available!==true||typeof siteKey!=='string'||!siteKey){
   registrationMessage('Registration is not enabled by the membership service yet.');
   return;
  }
  registrationMessage('Registration is enabled. Loading security verification…');
  const script=document.createElement('script');
  script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  script.async=true;
  let completed=false;
  const fail=message=>{if(completed)return;completed=true;registrationMessage(message);};
  const timeout=setTimeout(()=>fail('Security verification did not load. Please disable browser content blocking for this page and reload.'),12000);
  script.onload=()=>{
   clearTimeout(timeout);
   if(completed)return;
   if(!window.turnstile){fail('Security verification is unavailable in this browser.');return;}
   try{
    registrationWidget=window.turnstile.render(turnstileBox,{sitekey:siteKey,theme:'auto'});
    completed=true;
    registerButton.disabled=false;
    registerButton.textContent='Create free account';
    registerButton.removeAttribute('title');
    registrationMessage('Registration is open. Complete the security check, then create your account.');
   }catch{fail('Security verification could not initialize. Check browser privacy or content-blocking settings.');}
  };
  script.onerror=()=>{clearTimeout(timeout);fail('Security verification script was blocked or could not load. Check browser privacy or content-blocking settings.');};
  document.head.appendChild(script);
 }catch{registrationMessage('Unable to check registration availability. Please refresh the page.');}
}
registerForm.addEventListener('submit',async e=>{
 e.preventDefault();if(registerButton.disabled||registrationWidget===null||!window.turnstile)return;
 const turnstileToken=window.turnstile.getResponse(registrationWidget);
 if(!turnstileToken){registrationFeedback('Please complete the security check before registering.');return;}
 registerButton.disabled=true;registrationFeedback('Submitting your registration request…');
 try{const r=await request('/api/member/registration-request',{email:by('register-email').value.trim(),password:by('register-password').value,turnstileToken});
  if(r.code===202){registrationFeedback('Request received. If your email is eligible, a verification link will arrive shortly. Please check your Inbox and Spam folders.');by('register-password').value='';}
  else if(r.code===503){registrationFeedback('Registration could not be completed: the registration or email service is temporarily unavailable. Please do not keep resubmitting.');}
  else if(r.code===403){registrationFeedback('Security check was unsuccessful. Please refresh the challenge before trying again.');}
  else{registrationFeedback('Registration was not completed (HTTP '+r.code+'). Please check your details.');}
 }catch{say('Registration service could not be reached.');}
 finally{window.turnstile.reset(registrationWidget);registerButton.disabled=false;}
});
initRegistration();
// Verification links require an explicit click; mail scanners must not consume tokens.
// Remove the token from the visible URL before any asynchronous network request.
const params=new URLSearchParams(location.search),verificationToken=params.get('verify');
if(verificationToken!==null){
 history.replaceState(null,'',location.pathname+location.hash);
 const panel=document.createElement('section');panel.className='panel';
 const heading=document.createElement('h2');heading.textContent='Verify your email';panel.appendChild(heading);
 const description=document.createElement('p');description.textContent='Confirm your email to complete account registration. Verification links expire after 15 minutes.';panel.appendChild(description);
 const confirm=document.createElement('button');confirm.type='button';confirm.textContent='Confirm email address';panel.appendChild(confirm);
 const result=document.createElement('p');result.setAttribute('role','status');result.setAttribute('aria-live','polite');panel.appendChild(result);
 const main=document.querySelector('main');main.insertBefore(panel,main.firstChild);
 if(!/^[a-f0-9]{64}$/.test(verificationToken)){confirm.disabled=true;result.textContent='This verification link is invalid. Please request a new one when registration is available.';}
 else confirm.addEventListener('click',async()=>{confirm.disabled=true;result.textContent='Verifying your email…';try{const r=await request('/api/member/verify-email',{token:verificationToken});if(r.code===200&&r.data.verified===true){result.textContent='Email verified. You can now sign in securely.';confirm.remove();}else{result.textContent=r.code===503?'Email verification is not available yet.':'Verification could not be completed. The link may be expired or already used.';}}catch{result.textContent='Unable to contact the verification service. Please try again later.';}finally{if(confirm.isConnected)confirm.disabled=false;}});
}
const paymentReturn=['live-return','live-cancel'].includes(params.get('payment'));
if(paymentReturn){
 const cancelled=params.get('payment')==='live-cancel';
 const panel=document.createElement('section');panel.className='panel';
 const heading=document.createElement('h2');heading.textContent=cancelled?'Checkout cancelled':'Thank you for returning to KINDELORA';panel.appendChild(heading);
 const message=document.createElement('p');message.textContent=cancelled?'You can review your membership options and try again. Your membership status is shown separately below.':'Your payment has not been confirmed by this return page. Your membership status is checked securely below. If verification is pending, refresh this page before attempting another payment.';panel.appendChild(message);
 const link=document.createElement('a');link.href=cancelled?'/plus-checkout.html':'/member-welcome.html';link.textContent=cancelled?'Review membership options':'Continue to your account';panel.appendChild(link);
 const main=document.querySelector('main');main.insertBefore(panel,main.firstChild);
}
refresh();
})();