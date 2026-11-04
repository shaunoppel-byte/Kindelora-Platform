"use strict";
const moments={hope:["You don't have to have everything figured out today. One gentle step is enough.","A difficult chapter is not the whole story.","You deserve small moments of peace, even on busy days."],calm:["You are allowed to pause. Nothing needs to be solved in this moment.","Take one unhurried breath. The next step can wait a moment.","Rest is not something you need to earn."],courage:["You can be uncertain and still move forward.","Showing up as you are is its own quiet kind of courage.","Progress can be gentle and still be real."],gratitude:["Somewhere today, a small good thing is waiting to be noticed.","Your presence may be the bright spot in someone's day.","Even ordinary moments can hold something beautiful."]};
let theme="hope",index=0;
document.querySelectorAll("[data-theme]").forEach(b=>b.addEventListener("click",()=>{theme=b.dataset.theme;index=0;document.querySelectorAll("[data-theme]").forEach(x=>x.setAttribute("aria-pressed",String(x===b)));document.getElementById("moment").textContent=moments[theme][index];}));
document.getElementById("next-moment").addEventListener("click",()=>{index=(index+1)%moments[theme].length;document.getElementById("moment").textContent=moments[theme][index];});
document.querySelectorAll(".share").forEach(b=>b.addEventListener("click",async()=>{const s=document.getElementById("share-status");try{await navigator.clipboard.writeText(b.dataset.message);s.textContent="Message copied. Share it in your own way, when you're ready."}catch(e){s.textContent="Copy wasn't available in this browser. You can select the message above and copy it manually."}}));
const monthly=document.getElementById("billing-monthly"),annual=document.getElementById("billing-annual");
function setBilling(isAnnual){monthly.setAttribute("aria-pressed",String(!isAnnual));annual.setAttribute("aria-pressed",String(isAnnual));document.getElementById("plan-price").innerHTML=isAnnual?'$49.99 <span>/year</span>':'$4.99 <span>/month</span>';document.getElementById("plan-summary").textContent=isAnnual?"One upfront payment for 12 months · about $4.17/month. Save $9.89 (16.5%) compared with monthly billing.":"Billed monthly. $59.88 over 12 months.";document.getElementById("plan-details-title").textContent=isAnnual?"Annual membership explained":"Monthly membership explained";document.getElementById("plan-detail-copy").textContent=isAnnual?"Proposed annual payment of $49.99 upfront for 12 months, saving $9.89 versus twelve $4.99 monthly payments. Renewal, cancellation and refund terms will be published before launch.":"Proposed monthly payment of $4.99. Cancellation and refund terms will be published before launch.";document.getElementById("plan-details").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"nearest"});}
monthly.addEventListener("click",()=>setBilling(false));annual.addEventListener("click",()=>setBilling(true));
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
