/* KINDELORA optional, anonymous emotional check-in. No analytics, cookies, network requests or persistence. */
(function(){
  'use strict';
  const root=document.getElementById('emotional-check-in');
  if(!root)return;
  const buttons=[...root.querySelectorAll('[data-feeling]')];
  const response=root.querySelector('[data-check-in-response]');
  const messages={
    yes:"We're glad this moment brought a little light. Carry that feeling with you, at your own pace.",
    somewhat:"A little lighter still matters. You're welcome to stay for another gentle moment.",
    notyet:"Thank you for being here. You don't have to feel better on demand. Take your time; perhaps another affirmation or a quiet pause could help."
  };
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const choice=button.dataset.feeling;
    if(!Object.prototype.hasOwnProperty.call(messages,choice))return;
    buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    response.textContent=messages[choice];
    response.hidden=false;
    // Deliberately no storage or submission: the response stays only in this page.
  }));
})();
