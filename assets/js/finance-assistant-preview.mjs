import {answerFinanceQuery} from '/lib/finance/assistant-queries.mjs';
// Synthetic demonstration data only. Production authorisation must occur on the server.
const demoRows=[
 {business:'OPE',date:'2026-11-02',gross_minor:149900,fee_minor:4300,refund_minor:0,matched:true},
 {business:'KIN',date:'2026-11-05',gross_minor:12900,fee_minor:400,refund_minor:0,matched:false},
 {business:'VEL',date:'2026-11-08',gross_minor:39900,fee_minor:1200,refund_minor:0,matched:true},
 {business:'KDR',date:'2026-11-10',gross_minor:17900,fee_minor:550,refund_minor:0,matched:false},
 {business:'SOL',date:'2026-11-12',gross_minor:25000,fee_minor:750,refund_minor:5000,matched:true},
 {business:'KIN',date:'2026-10-15',gross_minor:10900,fee_minor:330,refund_minor:0,matched:true},
 {business:'VEL',date:'2026-10-20',gross_minor:45000,fee_minor:1400,refund_minor:0,matched:true}
];
const input=document.getElementById('finance-question'),answer=document.getElementById('finance-answer');
const business=document.getElementById('business'),period=document.getElementById('report-period');
function ask(q){
 const allowed=business.value==='all'?['OPE','KIN','VEL','KDR','SOL']:[business.value];
 try{const result=answerFinanceQuery({question:q,rows:demoRows,allowedBusinesses:allowed,period:period.value});answer.textContent=result.answer;}
 catch{answer.textContent='Unable to process the demonstration request. No financial changes were made.';}
}
document.getElementById('finance-ask').addEventListener('click',()=>ask(input.value));
input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();ask(input.value);}});
document.querySelectorAll('[data-ask]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.ask;ask(input.value);}));
document.getElementById('finance-copy-answer').addEventListener('click',async()=>{
 const s=document.getElementById('finance-copy-status');
 try{await navigator.clipboard.writeText(answer.textContent);s.textContent='Demonstration answer copied.';}catch{s.textContent='Copy unavailable in this browser.';}
});
