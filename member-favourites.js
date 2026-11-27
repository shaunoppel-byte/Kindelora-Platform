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
  dialog.innerHTML='<div class="member-gate-inner"><button type="button" class="member-gate-close" aria-label="Close">×</button><span class="member-gate-heart" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78a5.5 5.5 0 0 0 0-7.78Z"/></svg></span><h2 id="member-favourites-title">Keep the words that stay with you.</h2><p>Love this message? Your personal Favourites Library is a KINDELORA Plus membership benefit, so you can return to the moments that matter most.</p><p class="fine">Sign in to check your membership. This message has not been saved.</p><div class="actions"><a class="btn member-gate-explore" href="#membership">Explore KINDELORA Plus</a><button type="button" class="choice member-gate-later">Maybe later</button></div></div>';
  document.body.append(dialog);
  // Two separate collections under one consistent Favourites experience.
  // This is a preview only: there is no authenticated persistence yet.
  const collections=document.createElement("div");
  collections.className="member-favourite-collections";
  collections.innerHTML='<p class="member-collections-heading">Your PLUS Favourites</p><div class="member-collection-tabs" role="tablist" aria-label="Favourite collections"><button type="button" role="tab" id="member-tab-messages" aria-controls="member-panel-messages" aria-selected="true" tabindex="0">Messages</button><button type="button" role="tab" id="member-tab-affirmations" aria-controls="member-panel-affirmations" aria-selected="false" tabindex="-1">Affirmations</button></div><div role="tabpanel" id="member-panel-messages" aria-labelledby="member-tab-messages"><p>Sign in to check your PLUS membership.</p></div><div role="tabpanel" id="member-panel-affirmations" aria-labelledby="member-tab-affirmations" hidden><p>Sign in to check your PLUS membership.</p></div>';
  dialog.querySelector(".member-gate-inner .actions").before(collections);
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
  let checkSequence=0;
  function selectedItem(){
    if(!opener)return null;
    const kind=opener.dataset.heartType==="affirmation"?"affirmations":"messages";
    const card=opener.closest("article");
    const value=(kind==="affirmations"
      ?(card?.querySelector(".affirmation-quote")?.textContent??document.getElementById("affirmation-text")?.textContent)
      :opener.dataset.heart==="daily"
        ?[document.getElementById("daily-title")?.textContent,document.getElementById("daily-copy")?.textContent].filter(Boolean).join("\n\n")
        :document.getElementById("moment")?.textContent)?.trim();
    return value?{kind,value}:null;
  }
  function renderSaved(key,items){
    for(const kind of ["messages","affirmations"]){
      const panel=document.getElementById("member-panel-"+kind);
      panel.replaceChildren();
      const entries=items.filter(x=>x.kind===kind);
      if(!entries.length){const p=document.createElement("p");p.textContent="No saved items on this device.";panel.append(p);}
      for(const item of entries){
        const p=document.createElement("p");p.textContent=item.value;
        const remove=document.createElement("button");remove.type="button";remove.className="choice";remove.textContent="Remove";
        remove.addEventListener("click",async()=>{
          try{
            const [e,m]=await Promise.all(["entitlement","me"].map(x=>fetch("/api/member/"+x,{credentials:"same-origin",cache:"no-store"})));
            if(!e.ok||!m.ok||!dialog.open)return;
            const entitlement=await e.json(),identity=await m.json();
            if(entitlement.plus!==true||identity.authenticated!==true||key!=="kindelora-plus-favourites-v1:"+identity.member?.id)return;
            const current=JSON.parse(localStorage.getItem(key)||"[]").filter(x=>x.kind!==item.kind||x.value!==item.value);
            localStorage.setItem(key,JSON.stringify(current));renderSaved(key,current);
          }catch{dialog.querySelector(".fine").textContent="Unable to remove this item. Please try again.";}
        });
        panel.append(p,remove);
      }
    }
  }
  async function checkMembership(){
    const seq=++checkSequence;
    const item=selectedItem();
    const fine=dialog.querySelector(".fine");
    const link=dialog.querySelector(".member-gate-explore");
    for(const panel of collections.querySelectorAll("[role=tabpanel]"))panel.replaceChildren();
    fine.textContent="Checking your membership…";
    link.href="/plus-account.html";
    link.textContent="Sign in";
    try{
      const response=await fetch("/api/member/entitlement",{credentials:"same-origin",cache:"no-store"});
      if(seq!==checkSequence||!dialog.open)return;
      if(response.status===401){fine.textContent="Sign in to check your PLUS membership. Nothing has been saved.";return;}
      if(!response.ok)throw new Error("Membership unavailable");
      const data=await response.json();
      if(seq!==checkSequence||!dialog.open)return;
      if(data.authenticated!==true)throw new Error("Membership unavailable");
      if(data.plus===true){
        const identityResponse=await fetch("/api/member/me",{credentials:"same-origin",cache:"no-store"});
        if(!identityResponse.ok)throw new Error("Identity unavailable");
        const identity=await identityResponse.json();
        if(seq!==checkSequence||!dialog.open)return;
        if(identity.authenticated!==true||typeof identity.member?.id!=="string"||!identity.member.id)throw new Error("Identity unavailable");
        const key="kindelora-plus-favourites-v1:"+identity.member.id;
        let items=JSON.parse(localStorage.getItem(key)||"[]");
        if(!Array.isArray(items))throw new Error("Invalid saved data");
        if(item&&!items.some(x=>x.kind===item.kind&&x.value===item.value)){
          if(items.length>=100){fine.textContent="Your device library is full. Remove an item to save another.";}
          else{items.push(item);localStorage.setItem(key,JSON.stringify(items));fine.textContent="Saved to your PLUS Favourites on this device.";}
        }else fine.textContent=item?"Already saved on this device.":"Your PLUS Favourites on this device. This item could not be saved.";
        renderSaved(key,items);
        link.href="/member-welcome.html";
        link.textContent="Return to your account";
      }else{
        fine.textContent="Favourites require PLUS membership. Nothing has been saved.";
        link.href="/plus-checkout.html";
        link.textContent="Explore KINDELORA PLUS";
      }
    }catch(e){if(seq===checkSequence&&dialog.open)fine.textContent="We could not verify your membership. Please try again. Nothing has been saved.";}
  }
  function openGate(){if(typeof dialog.showModal==="function"){dialog.showModal();void checkMembership();}else window.location.href="/plus-account.html";}

  function close(){if(dialog.open)dialog.close();}
  dialog.querySelector(".member-gate-close").addEventListener("click",close);
  dialog.querySelector(".member-gate-later").addEventListener("click",close);
  dialog.querySelector(".member-gate-explore").addEventListener("click",close);
  dialog.addEventListener("click",e=>{if(e.target===dialog)close();});
  dialog.addEventListener("close",()=>{++checkSequence;for(const panel of collections.querySelectorAll("[role=tabpanel]"))panel.replaceChildren();if(opener&&opener.isConnected)opener.focus();});
  const heartPath="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z";
  document.querySelectorAll("[data-heart]").forEach(button=>{
    if(button.classList.contains("heart-save"))button.setAttribute("aria-pressed","false");
    if(!button.classList.contains("heart-save")){button.addEventListener("click",()=>{opener=button;openGate();});return;}
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
      openGate();
    });
  });
  // Shared Plus gate for affirmation hearts; do not pretend that a save succeeded.
  const gateTitle=dialog.querySelector("#member-favourites-title");
  const gateDescription=dialog.querySelector(".member-gate-inner > p");
  const defaultTitle=gateTitle.textContent;
  const defaultDescription=gateDescription.textContent;
  document.querySelectorAll('[data-heart-type="affirmation"]').forEach(button=>{
    button.addEventListener("click",()=>{
      selectCollection("affirmations",false);
      gateTitle.textContent="Keep the affirmations that stay with you.";
      gateDescription.textContent="Love this affirmation? Your personal Affirmation Favourites collection is a KINDELORA Plus benefit.";
    });
  });
  document.querySelectorAll('[data-heart]:not([data-heart-type="affirmation"])').forEach(button=>{
    button.addEventListener("click",()=>{
      selectCollection("messages",false);
      gateTitle.textContent=defaultTitle;
      gateDescription.textContent=defaultDescription;
    });
  });
  // Existing free favourites were local-only; do not erase a visitor's saved data.
})();
