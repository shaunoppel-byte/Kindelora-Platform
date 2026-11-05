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
  dialog.innerHTML='<div class="member-gate-inner"><button type="button" class="member-gate-close" aria-label="Close">×</button><span class="member-gate-heart" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 0-7.78Z"/></svg></span><h2 id="member-favourites-title">Keep the words that stay with you.</h2><p>Love this message? Your personal Favourites Library is a planned KINDELORA Plus benefit, so you can return to the moments that matter most.</p><p class="fine">Secure member sign-in and subscriptions are still being prepared. This message has not been saved and no payment will be taken.</p><div class="actions"><a class="btn member-gate-explore" href="#membership">Explore KINDELORA Plus</a><button type="button" class="choice member-gate-later">Maybe later</button></div></div>';
  document.body.append(dialog);
  let opener=null;
  function close(){if(dialog.open)dialog.close();}
  dialog.querySelector(".member-gate-close").addEventListener("click",close);
  dialog.querySelector(".member-gate-later").addEventListener("click",close);
  dialog.querySelector(".member-gate-explore").addEventListener("click",close);
  dialog.addEventListener("click",e=>{if(e.target===dialog)close();});
  dialog.addEventListener("close",()=>{if(opener&&opener.isConnected)opener.focus();});
  const heartPath="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z";
  document.querySelectorAll("[data-heart]").forEach(button=>{
    if(button.classList.contains("heart-save"))button.setAttribute("aria-pressed","false");
    if(!button.classList.contains("heart-save")){button.addEventListener("click",()=>{opener=button;if(typeof dialog.showModal==="function")dialog.showModal();else window.location.hash="membership";});return;}
    button.setAttribute("title","Save to Plus Favourites (membership required)");
    const svg=document.createElementNS("http://www.w3.org/2000/svg","svg");
    svg.setAttribute("viewBox","0 0 24 24");
    svg.setAttribute("aria-hidden","true");
    const path=document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d",heartPath);
    svg.append(path);
    button.replaceChildren(svg);
    button.addEventListener("click",()=>{
      opener=button;
      // Never claim a visitor is subscribed without verified server-side entitlement.
      if(typeof dialog.showModal==="function")dialog.showModal();
      else window.location.hash="membership";
    });
  });
  // Existing free favourites were local-only; do not erase a visitor's saved data.
})();
