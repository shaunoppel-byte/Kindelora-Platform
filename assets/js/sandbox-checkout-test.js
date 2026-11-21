let selectedPlan='monthly';
const button=document.getElementById('start'),status=document.getElementById('status'),details=document.getElementById('details');
document.querySelectorAll('[data-plan]').forEach(el=>el.addEventListener('click',()=>{selectedPlan=el.dataset.plan;document.querySelectorAll('[data-plan]').forEach(b=>b.setAttribute('aria-pressed',String(b===el)));status.hidden=true;details.textContent='';}));
button.addEventListener('click',async()=>{
 button.disabled=true;status.hidden=false;status.dataset.state='';status.textContent='Checking your secure sandbox checkout…';details.textContent='';
 try{
  const response=await fetch('/api/plus/sandbox-checkout',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({plan:selectedPlan})});
  const result=await response.json();
  if(!response.ok||result.ok!==true){status.dataset.state='error';status.textContent='Sandbox checkout could not start (HTTP '+response.status+').';details.textContent='Diagnostic: '+String(result.reason||'unknown');return}
  const redirect=result.redirect;
  if(result.environment!=='sandbox'||redirect?.method!=='POST'||redirect.action!=='https://sandbox.payfast.co.za/eng/process'||!redirect.fields||typeof redirect.fields!=='object')throw Error('Unexpected sandbox redirect response');
  status.dataset.state='success';status.textContent='Sandbox order created. Opening PayFast sandbox…';
  const form=document.createElement('form');form.method='POST';form.action=redirect.action;
  for(const [key,value] of Object.entries(redirect.fields)){if(typeof value!=='string')throw Error('Invalid sandbox field');const input=document.createElement('input');input.type='hidden';input.name=key;input.value=value;form.appendChild(input)}
  document.body.appendChild(form);form.submit();
 }catch{status.dataset.state='error';status.textContent='The sandbox test could not continue.';details.textContent='Check your sign-in and connection, then try again.'}
 finally{button.disabled=false}
});