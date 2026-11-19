// KINDELORA account UI: real auth APIs, no mock success, no browser-side entitlement grants.
(()=>{'use strict';
const by=id=>document.getElementById(id),status=by('status'),account=by('account-state'),entitlement=by('entitlement-state'),logout=by('logout');
const say=t=>{status.textContent=t};
const request=async(path,body)=>{const options={credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}};if(body){options.method='POST';options.headers['Content-Type']='application/json';options.body=JSON.stringify(body)}const r=await fetch(path,options);let data={};try{data=await r.json()}catch{}return {code:r.status,data}};
async function refresh(){try{const r=await request('/api/member/me');if(r.code===200&&r.data.authenticated){account.textContent='Signed in as '+r.data.member.email;logout.hidden=false;const e=await request('/api/member/entitlement');entitlement.textContent=e.code===200&&e.data.plus===true?'Verified PLUS membership active.':'PLUS membership is not active or cannot be verified.';}else{logout.hidden=true;account.textContent=r.code===503?'Account service is not configured yet.':'You are not signed in.';entitlement.textContent='PLUS access has not been verified.';}}catch{account.textContent='Account service is temporarily unavailable.';entitlement.textContent='PLUS access has not been verified.';logout.hidden=true;}}
by('login').addEventListener('submit',async e=>{e.preventDefault();const b=e.currentTarget.querySelector('button');b.disabled=true;say('Checking sign-in…');try{const r=await request('/api/member/login',{email:by('login-email').value.trim(),password:by('login-password').value});say(r.code===200?'Signed in successfully.':r.code===503?'Secure sign-in is not available yet.':r.code===429?'Too many attempts. Please try again later.':'Sign-in unsuccessful. Please check your details.');if(r.code===200){by('login-password').value='';await refresh()}}catch{say('Sign-in service could not be reached.')}finally{b.disabled=false}});
logout.addEventListener('click',async()=>{try{const r=await request('/api/member/logout',{});say(r.code===200?'Signed out.':'Sign-out could not be confirmed.')}catch{say('Sign-out could not be confirmed.')}await refresh()});
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
refresh();
})();