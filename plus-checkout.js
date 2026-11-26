'use strict';
(()=>{
 const plans={monthly:{name:'Monthly',price:'$8.99 USD',term:'Every month'},annual:{name:'Annual',price:'$89.99 USD',term:'Every year'}};
 const buttons={monthly:document.getElementById('monthly'),annual:document.getElementById('annual')};
 const submit=document.getElementById('checkout-submit'),status=document.getElementById('checkout-status');
 let checkoutEnabled=false,signInRequired=false;
 let selected='monthly',busy=false;
 function choose(id){if(busy||!Object.hasOwn(plans,id))return;selected=id;for(const link of document.querySelectorAll('a[href^="/plus-account.html"]'))link.href='/plus-account.html?checkoutPlan='+id;for(const [key,button] of Object.entries(buttons))button.setAttribute('aria-pressed',String(key===id));const p=plans[id];for(const [field,value] of Object.entries({'summary-plan':p.name,'summary-price':p.price,'summary-term':p.term,'summary-total':p.price}))document.getElementById(field).textContent=value;}
 for(const [id,button] of Object.entries(buttons))button.addEventListener('click',()=>choose(id));
 function message(value){status.textContent=value;}
 submit.disabled=true; message('Checking secure checkout…');
 fetch('/api/member/commercial-readiness',{credentials:'same-origin',cache:'no-store'}).then(async r=>{if(r.status===401){signInRequired=true;submit.textContent='Sign in to continue';submit.disabled=false;message('Sign in to your verified account to continue.');return;} if(!r.ok)throw Error('readiness'); const d=await r.json();checkoutEnabled=d.productionPrerequisitesReady===true;submit.disabled=!checkoutEnabled;submit.textContent=checkoutEnabled?'Continue securely to PayFast':'Checkout temporarily unavailable';message(checkoutEnabled?'Review and authorise your payment securely at PayFast.':'Secure checkout is temporarily unavailable. No payment has been taken.');}).catch(()=>{submit.textContent='Checkout temporarily unavailable';message('Unable to check payment availability. Refresh to try again.');});
 submit.addEventListener('click',async()=>{
  if(busy)return;
  if(signInRequired){location.assign('/plus-account.html?checkoutPlan='+selected);return;}
  if(!checkoutEnabled){message('Secure checkout is currently unavailable. No payment has been taken.');return;}
  busy=true;submit.disabled=true;message('Preparing your secure checkout…');
  try{
   const response=await fetch('/api/plus/checkout',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({plan:selected}),cache:'no-store'});
   if(response.status===401){location.assign('/plus-account.html?checkoutPlan='+selected);return;}
   if(!response.ok){message(response.status===503?'Secure payments are temporarily unavailable. No payment has been taken. Please try again later.':'Unable to prepare checkout. No payment has been taken. Please try again.');return;}
   const result=await response.json();
   const redirect=result?.redirect;
   if(result?.ok!==true||result.checkoutReady!==true||redirect?.action!=='https://www.payfast.co.za/eng/process'||redirect?.method!=='POST'||!redirect.fields||typeof redirect.fields!=='object'||Array.isArray(redirect.fields))throw Error('Invalid payment handoff');
   const allowed=new Set(['merchant_id','merchant_key','return_url','cancel_url','notify_url','m_payment_id','amount','item_name','subscription_type','frequency','cycles','recurring_amount','signature']);
   if(Object.keys(redirect.fields).some(k=>!allowed.has(k))||!['merchant_id','merchant_key','m_payment_id','amount','signature'].every(k=>typeof redirect.fields[k]==='string'&&redirect.fields[k].length>0))throw Error('Invalid payment fields');
   const form=document.createElement('form');form.method='POST';form.action=redirect.action;form.style.display='none';
   for(const [key,value] of Object.entries(redirect.fields)){if(typeof value!=='string')throw Error('Invalid payment field');const input=document.createElement('input');input.type='hidden';input.name=key;input.value=value;form.appendChild(input);}
   document.body.appendChild(form);message('Redirecting to PayFast for final payment review…');form.submit();return;
  }catch{message('Secure checkout could not be prepared. No payment has been taken. Please try again.');}
  finally{busy=false;submit.disabled=!checkoutEnabled;}
 });
 choose(new URLSearchParams(location.search).get('plan')==='annual'?'annual':'monthly');
})();