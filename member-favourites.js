"use strict";
// KINDELORA Plus Favourites — gated preview. Never infer paid status from local storage.
(function(){
  const oldSection=document.getElementById("favourites");
  // Preserve previously saved device data without presenting it as a paid entitlement.
  if(oldSection)oldSection.hidden=true;
  const dialog=document.createElement("dialog");
  dialog.id="member-favourites-gate";
  dialog.className="member-favourites-gate";
  dialog.setAttribute("aria-labelledby","member-favourites-title");
  dialog.innerHTML='<div class="member-gate-inner"><button type="button" class="member-gate-close" aria-label="Close">×</button><span class="member-gate-heart" aria-hidden="true">♥</span><h2 id="member-favourites-title">Keep the words that stay with you.</h2><p>Love this message? Your personal Favourites Library is a planned KINDELORA Plus benefit, so you can return to the moments that matter most.</p><p class="fine">Secure member sign-in and subscriptions are still being prepared. This message has not been saved and no payment will be taken.</p><div class="actions"><a class="btn member-gate-explore" href="#membership">Explore KINDELORA Plus</a><button type="button" class="choice member-gate-later">Maybe later</button></div></div>';
  document.body.append(dialog);
  let opener=null;
  function close(){if(dialog.open)dialog.close();}
  dialog.querySelector(".member-gate-close").addEventListener("click",close);
  dialog.querySelector(".member-gate-later").addEventListener("click",close);
  dialog.querySelector(".member-gate-explore").addEventListener("click",close);
  dialog.addEventListener("click",e=>{if(e.target===dialog)close();});
  dialog.addEventListener("close",()=>{if(opener&&opener.isConnected)opener.focus();});
  document.querySelectorAll("[data-heart]").forEach(button=>{
    button.addEventListener("click",()=>{
      opener=button;
      // Never claim a visitor is subscribed without verified server-side entitlement.
      if(typeof dialog.showModal==="function")dialog.showModal();
      else window.location.hash="membership";
    });
  });
  // Existing free favourites were local-only; do not erase a visitor's saved data.
})();
