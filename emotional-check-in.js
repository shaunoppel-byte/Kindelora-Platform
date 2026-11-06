/* KINDELORA optional, anonymous emotional check-in. No analytics, cookies, network requests or persistence. */
(function(){
  'use strict';
  const root=document.getElementById('emotional-check-in');
  if(!root)return;
  const buttons=[...root.querySelectorAll('[data-feeling]')];
  const response=root.querySelector('[data-check-in-response]');
  const next=root.querySelector('[data-check-in-next]');
  const messages={
    yes:"We're glad this moment brought a little light. Whatever comes next, remember that reaching out for support is always welcome.",
    somewhat:"A little lighter still matters. You deserve care and connection, even on difficult days. Stay for another gentle moment if you'd like.",
    notyet:"Thank you for being here. You don't have to feel better on demand, and you don't have to carry everything alone. If it feels right, reach out to someone you trust, or stay for another gentle moment."
  };
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const choice=button.dataset.feeling;
    if(!Object.prototype.hasOwnProperty.call(messages,choice))return;
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    response.textContent=messages[choice];
    response.hidden=false;
    if(next){
      // Offer continued support without assuming the visitor's emotional state.
      next.hidden=choice==='yes';
      const affirmation=next.querySelector('a[href="#affirmations"]');
      const restart=next.querySelector('a[href="#top"]');
      if(affirmation)affirmation.textContent=choice==='notyet'?'Stay for another gentle affirmation':'Explore another affirmation';
      if(restart)restart.textContent=choice==='notyet'?'Return whenever you feel ready':'Return to a fresh start';
    }
    // Deliberately no storage or submission: the response stays only in this page.
  }));
})();
