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
  dialog.innerHTML='<div class="member-gate-inner"><button type="button" class="member-gate-close" aria-label="Close">×</button><span class="member-gate-heart" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 0-7.78Z"/></svg></span><h2 id="member-favourites-title">Keep the words that stay with you.</h2><p>Love this message? Your personal Favourites Library is a KINDELORA Plus membership benefit, so you can return to the moments that matter most.</p><p class="fine">Secure member access will be enabled after account and payment verification. This message has not been saved and no payment will be taken.</p><div class="actions"><a class="btn member-gate-explore" href="#membership">Explore KINDELORA Plus</a><button type="button" class="choice member-gate-later">Maybe later</button></div></div>';
  document.body.append(dialog);
  // Two separate collections under one consistent Favourites experience.
  // This is a preview only: there is no authenticated persistence yet.
  const collections=document.createElement("div");
  collections.className="member-favourite-collections";
  collections.innerHTML='<p class="member-collections-heading">Your future Plus Favourites</p><div class="member-collection-tabs" role="tablist" aria-label="Favourite collections"><button type="button" role="tab" id="member-tab-messages" aria-controls="member-panel-messages" aria-selected="true" tabindex="0">Messages</button><button type="button" role="tab" id="member-tab-affirmations" aria-controls="member-panel-affirmations" aria-selected="false" tabindex="-1">Affirmations</button></div><div role="tabpanel" id="member-panel-messages" aria-labelledby="member-tab-messages"><p>Save meaningful messages here once secure KINDELORA Plus access is available.</p></div><div role="tabpanel" id="member-panel-affirmations" aria-labelledby="member-tab-affirmations" hidden><p>Save your favourite affirmations here once secure KINDELORA Plus access is available.</p></div>';
  dialog.querySelector(".member-gate-inner .actions").before(collections);
  // Curated editorial previews only. Actual per-member favourites require authenticated storage.
  const affirmationPanel=collections.querySelector("#member-panel-affirmations");
  const intro=affirmationPanel.querySelector("p");
  intro.textContent="Explore the premium visual direction below. These are editorial previews, not saved items. Your personal collection will appear here after secure member access launches.";
  const gallery=document.createElement("div");
  gallery.className="affirmation-favourites-preview";
  const previews=[
    {theme:"Self-worth",title:"I am enough",quote:"I am enough, exactly as I am. My worth is not defined by my past, my mistakes or others’ opinions."},
    {theme:"Courage",title:"Ready for what comes next",quote:"I choose positivity, focus and action today. I am capable, resilient and ready for the opportunities ahead."},
    {theme:"Gratitude",title:"The good in today",quote:"I am grateful for today, for the lessons it brings, for the growth it creates, and for the blessings already in my life."}
  ];
  previews.forEach(item=>{
    const article=document.createElement("article");
    article.className="affirmation-preview-card";
    const eyebrow=document.createElement("span");eyebrow.className="affirmation-preview-theme";eyebrow.textContent=item.theme;
    const title=document.createElement("h3");title.textContent=item.title;
    const quote=document.createElement("blockquote");quote.textContent="“"+item.quote+"”";
    const footer=document.createElement("a");footer.href="https://kindelora.pages.dev/";footer.textContent="KINDELORA · Visit website";footer.rel="noopener";
    article.append(eyebrow,title,quote,footer);
    gallery.append(article);
  });
  affirmationPanel.append(gallery);
  const tabs=Array.from(collections.querySelectorAll('[role="tab"]'));
  function selectCollection(kind,focus){
    tabs.forEach(tab=>{
      const selected=tab.id==="member-tab-"+kind;
      tab.setAttribute("aria-selected",String(selected));
      tab.tabIndex=selected?0:-1;
      const panel=document.getElementById(tab.getAttribute("aria-controls"));
      panel.hidden=!selected;
      if(selected&&focus)tab.focus();
    });
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener("click",()=>selectCollection(index===0?"messages":"affirmations",false));
    tab.addEventListener("keydown",event=>{
      if(!["ArrowLeft","ArrowRight","Home","End"].includes(event.key))return;
      event.preventDefault();
      const next=event.key==="Home"?0:event.key==="End"?tabs.length-1:(index+(event.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;
      selectCollection(next===0?"messages":"affirmations",true);
    });
  });

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
  // Shared Plus gate for affirmation hearts; do not pretend that a save succeeded.
  const gateTitle=dialog.querySelector("#member-favourites-title");
  const gateDescription=dialog.querySelector(".member-gate-inner > p");
  const defaultTitle=gateTitle.textContent;
  const defaultDescription=gateDescription.textContent;
  const gateFine=dialog.querySelector(".member-gate-inner > p.fine");
  document.querySelectorAll('[data-heart-type="affirmation"]').forEach(button=>{
    button.addEventListener("click",()=>{
      selectCollection("affirmations",false);
      gateFine.textContent="Secure member access will be enabled after account and payment verification. This affirmation has not been saved and no payment will be taken.";
      gateTitle.textContent="Keep the affirmations that stay with you.";
      gateDescription.textContent="Love this affirmation? Your personal Affirmation Favourites collection is a planned KINDELORA Plus benefit. Secure saving will be available after account and membership verification.";
    });
  });
  document.querySelectorAll('[data-heart]:not([data-heart-type="affirmation"])').forEach(button=>{
    button.addEventListener("click",()=>{
      selectCollection("messages",false);
      gateFine.textContent="Secure member access will be enabled after account and payment verification. This message has not been saved and no payment will be taken.";
      gateTitle.textContent=defaultTitle;
      gateDescription.textContent=defaultDescription;
    });
  });
  // Existing free favourites were local-only; do not erase a visitor's saved data.
})();
