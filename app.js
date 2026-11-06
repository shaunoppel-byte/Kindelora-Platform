"use strict";
const moments={hope:["You don't have to have everything figured out today. One gentle step is enough.","A difficult chapter is not the whole story.","You deserve small moments of peace, even on busy days."],calm:["You are allowed to pause. Nothing needs to be solved in this moment.","Take one unhurried breath. The next step can wait a moment.","Rest is not something you need to earn."],courage:["You can be uncertain and still move forward.","Showing up as you are is its own quiet kind of courage.","Progress can be gentle and still be real."],gratitude:["Somewhere today, a small good thing is waiting to be noticed.","Your presence may be the bright spot in someone's day.","Even ordinary moments can hold something beautiful."]};
let theme="hope",index=0;
document.querySelectorAll("[data-theme]").forEach(b=>b.addEventListener("click",()=>{theme=b.dataset.theme;index=0;document.querySelectorAll("[data-theme]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));document.getElementById("moment").textContent=moments[theme][index];}));
document.getElementById("next-moment").addEventListener("click",()=>{index=(index+1)%moments[theme].length;document.getElementById("moment").textContent=moments[theme][index];});
document.querySelectorAll(".share").forEach(b=>b.addEventListener("click",async()=>{const s=document.getElementById("share-status");try{await navigator.clipboard.writeText(b.dataset.message);s.textContent="Message copied. Share it in your own way, when you're ready."}catch(e){s.textContent="Copy wasn't available in this browser. You can select the message above and copy it manually."}}));
// Founder-authorised public catalogue. Built-in moments remain the offline fallback.
(function(){
const mapping={hope:["hope","new_beginnings","everyday_optimism","waiting_for_news","unexpected_change","meaningful_moments","making_space_for_joy","life_transitions","disappointment","small_joys"],calm:["calm","gentle_mornings","evening_reflection","patience","rest_without_guilt","nature_and_stillness","being_present","finding_focus","body_kindness","weathering_busy_seasons"],courage:["courage","quiet_confidence","healthy_ambition","learning_from_errors","creative_courage","decisions","first_day_nerves","restarting_after_pause","feeling_stuck","growth"],gratitude:["gratitude","unspoken_appreciation","everyday_kindness","receiving_kindness","shared_humanity","friendship","family_care","special_occasions","celebrating_difference","community_spirit"]};
const seen={};
function shuffle(items){const a=items.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function rotate(t){if(!seen[t]||!seen[t].length)seen[t]=shuffle(moments[t]);return seen[t].pop();}
fetch("/message-catalogue.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("catalogue unavailable");return r.json();}).then(data=>{
 if(!data||!Array.isArray(data.messages)||data.messages.length!==2100)return;
 const valid=data.messages.filter(m=>m&&typeof m.text==="string"&&m.text.length>=20&&m.text.length<=400&&typeof m.theme==="string");
 if(valid.length!==2100||new Set(valid.map(m=>m.id)).size!==2100)return;
 // Classify all approved themes, including the new expansion, into four reader needs.
 const classify=(name)=>{
  const n=name.toLowerCase();
  if(/grat|thank|friend|family|parent|child|sibling|neigh|kind|share|guest|host|someone|loved|letter|celebrat|proud|gift|reconnect|meal|community|appreciat|support|listen|tradition|belong|remember|relationship/.test(n))return "gratitude";
  if(/courage|new|first|begin|learn|interview|project|goal|decision|choice|drive|responsib|mistake|opportun|game|perform|disagree|apolog|try|progress|work|career|meeting|challenge|change_your_mind/.test(n))return "courage";
  if(/calm|quiet|rest|weather|garden|plant|sunrise|evening|morning|pause|break|overwhelm|energy|wait|home|routine|time|week|busy|nature|still|focus|sleep|holiday|book|song|photo|journey|hobby|recipe/.test(n))return "calm";
  return "hope";
 };
 const themeToNeed=new Map();
 for(const [need,themes] of Object.entries(mapping))for(const t of themes)themeToNeed.set(t,need);
 for(const need of Object.keys(mapping)){
  const pool=valid.filter(m=>(themeToNeed.get(m.theme)||classify(m.theme))===need).map(m=>m.text);
  if(pool.length>=10){moments[need]=pool;seen[need]=shuffle(pool);}
 }
 const current=document.getElementById("moment");if(current)current.textContent=rotate(theme);
 document.querySelectorAll("[data-theme]").forEach(b=>b.addEventListener("click",()=>{const t=b.dataset.theme;if(moments[t]&&moments[t].length>3)document.getElementById("moment").textContent=rotate(t);}));
 document.getElementById("next-moment")?.addEventListener("click",()=>{if(moments[theme].length>3)document.getElementById("moment").textContent=rotate(theme);});
}).catch(()=>{/* Existing offline messages remain usable. */});
})();

// Plus pricing is informational until the subscription service launches.
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("/sw.js").catch(()=>{}));

const dailyMessages={
overwhelmed:[
["You don't have to carry the whole day at once.","When everything feels urgent, even the smallest task can feel heavy. You don't need to solve everything right now. Choose one thing that matters, give it your attention, and allow that to be enough for this moment.","Choose one manageable next step."],
["A slower pace is still a way forward.","Some days ask for more than we have to give. It is okay to simplify your list and focus on what genuinely needs your attention.","Let one nonessential task wait."]
],
motivation:[
["Progress begins before confidence arrives.","You may not feel completely ready, and that's okay. Momentum often follows action rather than preceding it. Start with something small enough to do today, and let that first step create room for the next.","Give one important task five focused minutes."],
["The next chapter starts with an ordinary step.","Big ambitions are built in small, unremarkable moments. You don't need a perfect plan to make meaningful progress today.","Complete one small part of something that matters."]
],
gratitude:[
["Not every meaningful moment announces itself.","Some of the best parts of life arrive quietly: someone remembering your name, a thoughtful message, or a moment of peace. Today, notice one ordinary thing you would miss if it were gone.","Tell someone what you appreciate about them."],
["The ordinary can be extraordinary.","A familiar voice, a shared laugh, or a moment of stillness can be worth more than we realise. Gratitude gives those moments room to be noticed.","Notice one good thing and name it."]
],
courage:[
["You can move forward without knowing every answer.","Courage isn't the absence of uncertainty. Sometimes it's choosing to have the conversation, take the opportunity, or begin again while uncertainty is still there.","Take one honest step toward what matters."],
["You are allowed to begin imperfectly.","Waiting until you feel fearless can mean waiting forever. Your first attempt can be messy and still be worthwhile.","Try the first small step, without demanding perfection."]
]};
let dailyNeed="overwhelmed",dailyIndex=0;
function showDaily(){const [title,copy,action]=dailyMessages[dailyNeed][dailyIndex];document.getElementById("daily-title").textContent=title;document.getElementById("daily-copy").textContent=copy;document.getElementById("daily-action").textContent="One small step: "+action;document.getElementById("daily-feedback").textContent="";}
document.querySelectorAll(".daily-choice").forEach(button=>button.addEventListener("click",()=>{dailyNeed=button.dataset.need;dailyIndex=0;document.querySelectorAll(".daily-choice").forEach(b=>b.setAttribute("aria-pressed",String(b===button)));showDaily();}));
document.getElementById("daily-next").addEventListener("click",()=>{dailyIndex=(dailyIndex+1)%dailyMessages[dailyNeed].length;showDaily();});
document.getElementById("daily-copy-button").addEventListener("click",async()=>{const [title,copy,action]=dailyMessages[dailyNeed][dailyIndex];try{await navigator.clipboard.writeText(title+"\n\n"+copy+"\n\nOne small step: "+action);document.getElementById("daily-feedback").textContent="Copied. Share this moment with someone who might need it.";}catch(e){document.getElementById("daily-feedback").textContent="Copy isn't available here. You can select the message above and copy it manually.";}});


// Calendar handoff is initiated only by the guest; no account or tracking required.
const checkinMessage="Just checking in with yourself. Did a small moment of kindness make today a little easier? Whatever today held, you deserve a gentle ending.";
const checkinStatus=document.getElementById("calendar-status");
function checkinDates(){
 const now=new Date(),start=new Date(now);
 start.setHours(Number(document.getElementById("checkin-time").value),0,0,0);
 if(start<=now)start.setDate(start.getDate()+1);
 return {start,end:new Date(start.getTime()+10*60000)};
}
const checkinUtc=d=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");
function calendarOpen(provider){
 const {start,end}=checkinDates(),title="A gentle KINDELORA check-in";
 let url;
 if(provider==="google"){
   const params=new URLSearchParams({action:"TEMPLATE",text:title,dates:checkinUtc(start)+"/"+checkinUtc(end),details:checkinMessage});
   url="https://calendar.google.com/calendar/render?"+params.toString();
 }else{
   const params=new URLSearchParams({rru:"addevent",subject:title,startdt:start.toISOString(),enddt:end.toISOString(),body:checkinMessage});
   url="https://outlook.office.com/calendar/0/deeplink/compose?"+params.toString();
 }
 const link=document.createElement("a");
 link.href=url;link.target="_blank";link.rel="noopener noreferrer";
 document.body.appendChild(link);link.click();link.remove();
 checkinStatus.textContent="Calendar handoff requested. If a new tab opened, review the event and select Save. If nothing opened, check your browser pop-up settings. KINDELORA has not saved a reminder.";
}
document.getElementById("calendar-google").addEventListener("click",()=>calendarOpen("google"));
document.getElementById("calendar-outlook").addEventListener("click",()=>calendarOpen("outlook"));
document.getElementById("calendar-checkin").addEventListener("click",()=>{
 const {start,end}=checkinDates();
 // UTC times avoid floating-local-time ambiguity across calendar apps.
 const escapeIcs=s=>s.replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;");
 const content=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//KINDELORA//Gentle Check-In//EN","BEGIN:VEVENT","UID:"+Date.now()+"-kindelora@kindelora.pages.dev","DTSTAMP:"+checkinUtc(new Date()),"DTSTART:"+checkinUtc(start),"DTEND:"+checkinUtc(end),"SUMMARY:A gentle KINDELORA check-in","DESCRIPTION:"+escapeIcs(checkinMessage),"BEGIN:VALARM","TRIGGER:PT0M","ACTION:DISPLAY","DESCRIPTION:A gentle KINDELORA check-in","END:VALARM","END:VEVENT","END:VCALENDAR",""].join("\r\n");
 const url=URL.createObjectURL(new Blob([content],{type:"text/calendar;charset=utf-8"}));
 const link=document.createElement("a");link.href=url;link.download="kindelora-gentle-checkin.ics";document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 checkinStatus.textContent="Calendar file downloaded. Open it from Downloads, review the event, then choose Add or Save in your calendar. Downloading alone does not create a reminder.";
});


const updateFrequency=document.getElementById("updates-frequency"),updateChannel=document.getElementById("updates-channel"),updateStatus=document.getElementById("updates-status");
try{const saved=JSON.parse(localStorage.getItem("kindelora-communication-preferences")||"null");if(saved&&["off","daily","weekly"].includes(saved.frequency)&&["none","email","app"].includes(saved.channel)){updateFrequency.value=saved.frequency;updateChannel.value=saved.channel}}catch(e){}
document.getElementById("save-update-preferences").addEventListener("click",()=>{try{localStorage.setItem("kindelora-communication-preferences",JSON.stringify({frequency:updateFrequency.value,channel:updateChannel.value}));updateStatus.textContent="Saved on this device only. No messages will be sent until a separate opt-in service is launched."}catch(e){updateStatus.textContent="Your browser did not allow local storage. Nothing was saved."}});
document.getElementById("clear-update-preferences").addEventListener("click",()=>{try{localStorage.removeItem("kindelora-communication-preferences")}catch(e){}updateFrequency.value="off";updateChannel.value="none";updateStatus.textContent="Local communication preferences cleared."});
document.getElementById("test-app-notification").addEventListener("click",async()=>{if(!("Notification" in window)){updateStatus.textContent="This browser does not support website notifications.";return}try{const permission=Notification.permission==="granted"?"granted":await Notification.requestPermission();if(permission!=="granted"){updateStatus.textContent="Notifications were not enabled. You remain in control.";return}const registration="serviceWorker" in navigator?await navigator.serviceWorker.ready:null;if(registration&&registration.showNotification){await registration.showNotification("A gentle KINDELORA moment",{body:"A small moment of kindness can brighten a day.",icon:"/icon.svg",tag:"kindelora-user-requested-test"});}else{new Notification("A gentle KINDELORA moment",{body:"A small moment of kindness can brighten a day."});}updateStatus.textContent="Test notification requested. This does not schedule future notifications."}catch(e){updateStatus.textContent="This device could not display a notification. Check browser permissions or use the calendar reminder instead."}});

// Keep the experience visually complete when an external photograph is unavailable.
document.querySelectorAll("img[data-fallback]").forEach(image=>{image.addEventListener("error",()=>{if(image.src!==new URL(image.dataset.fallback,location.origin).href){image.src=image.dataset.fallback;}})});


// Optional, device-local reflection: never transmitted or silently synced.
(function(){
const kind=document.getElementById("reflection-kind"),entry=document.getElementById("reflection-text"),status=document.getElementById("reflection-status");
if(!kind||!entry||!status)return;
const key="kindelora-private-reflection-v1";
try{const saved=JSON.parse(localStorage.getItem(key)||"null");if(saved&&["intention","gratitude","action"].includes(saved.kind)&&typeof saved.text==="string"){kind.value=saved.kind;entry.value=saved.text.slice(0,500);status.textContent="Your previously saved reflection has been restored from this device."}}catch(e){}
document.getElementById("reflection-save").addEventListener("click",()=>{const text=entry.value.trim();if(!text){status.textContent="Write a thought first, or leave this moment blank. There is no pressure.";return}try{localStorage.setItem(key,JSON.stringify({kind:kind.value,text:text.slice(0,500)}));const verify=JSON.parse(localStorage.getItem(key)||"null");status.textContent=verify&&verify.text===text.slice(0,500)?"Saved and verified on this device. Your words should remain here when you return in this browser.":"The browser could not verify your saved reflection. Please copy your words before leaving."}catch(e){status.textContent="This browser cannot save locally. Your words were not saved."}});
document.getElementById("reflection-clear").addEventListener("click",()=>{try{localStorage.removeItem(key)}catch(e){}entry.value="";kind.value="intention";status.textContent="Your saved reflection has been cleared from this browser."});
})();


(function(){
const key="kindelora-favourites-v1",list=document.getElementById("favourites-list"),status=document.getElementById("favourites-status");
if(!list||!status)return;
function read(){try{const v=JSON.parse(localStorage.getItem(key)||"[]");return Array.isArray(v)?v.filter(x=>typeof x==="string").slice(0,12):[]}catch(e){return []}}
function render(){list.replaceChildren();const items=read();if(!items.length){const p=document.createElement("p");p.textContent="No saved thoughts yet. Find a moment that resonates and save it here.";list.append(p);return}
items.forEach((value,i)=>{const wrap=document.createElement("div");wrap.className="favourite-item";const p=document.createElement("p");p.textContent=value;const b=document.createElement("button");b.type="button";b.className="choice";b.textContent="Remove";b.setAttribute("aria-label","Remove saved thought "+(i+1));b.addEventListener("click",()=>{try{localStorage.setItem(key,JSON.stringify(read().filter(x=>x!==value)));status.textContent="Saved thought removed."}catch(e){status.textContent="Unable to update saved thoughts in this browser."}render()});wrap.append(p,b);list.append(wrap)})}
document.getElementById("save-favourite").addEventListener("click",()=>{const value=document.getElementById("moment")?.textContent?.trim();if(!value)return;const items=read();if(items.includes(value)){status.textContent="You have already saved this thought.";return}if(items.length>=12){status.textContent="Your library holds 12 thoughts. Remove one to save another.";return}try{localStorage.setItem(key,JSON.stringify([...items,value]));status.textContent="Thought saved on this device.";render()}catch(e){status.textContent="This browser could not save your thought."}});
document.getElementById("clear-favourites").addEventListener("click",()=>{try{localStorage.removeItem(key);status.textContent="All saved thoughts cleared from this browser."}catch(e){status.textContent="Unable to clear saved thoughts."}render()});
document.getElementById("share-current")?.addEventListener("click",async()=>{const message=document.getElementById("moment")?.textContent?.trim();if(!message)return;const status=document.getElementById("share-status");try{if(navigator.share){await navigator.share({title:"A KINDELORA moment",text:message});status.textContent="Thank you for sharing a little kindness.";return}if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(message);status.textContent="Encouragement copied. Share it whenever you're ready.";return}status.textContent="Select and copy the message above to share it."}catch(e){status.textContent=e.name==="AbortError"?"Sharing cancelled. No problem.":"Sharing was unavailable. You can select and copy the message."}});
render();
})();


/* Plus checkout readiness. UI never grants paid entitlements or stores payment credentials. */
(function(){
 const monthly=document.getElementById("plus-monthly-choice"),annual=document.getElementById("plus-annual-choice");
 const summary=document.getElementById("plus-selection-summary"),availability=document.getElementById("plus-availability"),checkout=document.getElementById("plus-checkout-button");
 if(!monthly||!annual||!summary||!availability||!checkout)return;
 function select(isAnnual){monthly.setAttribute("aria-pressed",String(!isAnnual));annual.setAttribute("aria-pressed",String(isAnnual));summary.textContent=isAnnual?"Selected: Annual · $69.99 USD indicative price (save approximately 16.6%). Actual billing currency and price will be confirmed before checkout.":"Selected: Monthly · $6.99 USD indicative price. Actual billing currency and price will be confirmed before checkout.";}
 monthly.addEventListener("click",()=>select(false));annual.addEventListener("click",()=>select(true));
 checkout.disabled=true;
 fetch("/api/plus/status",{cache:"no-store",credentials:"same-origin"}).then(async response=>{
  if(!response.ok)throw Error("Unavailable");
  const data=await response.json();
  availability.textContent=data.checkoutAvailable===false?"KINDELORA Plus is ready for checkout activation. PayFast merchant approval and secure payment verification are pending; no charge will be made.":"PayFast activation and secure payment verification are required before checkout can be enabled.";
 }).catch(()=>{availability.textContent="Checkout activation is pending PayFast verification. You can continue exploring KINDELORA for free.";});
})();
