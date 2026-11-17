import {summarise,reportCsv,BUSINESS_LABELS} from './finance-reporting-engine.js';
// PUBLIC PREVIEW ONLY. Fake data, no private finance information or API requests.
const synthetic=Object.freeze([
 {business:'OPE',date:'2026-11-02',gross_minor:149900,fee_minor:4300,refund_minor:0,matched:true},
 {business:'KIN',date:'2026-11-05',gross_minor:12900,fee_minor:400,refund_minor:0,matched:false},
 {business:'VEL',date:'2026-11-08',gross_minor:39900,fee_minor:1200,refund_minor:0,matched:true},
 {business:'KDR',date:'2026-11-10',gross_minor:17900,fee_minor:550,refund_minor:0,matched:false},
 {business:'SOL',date:'2026-11-12',gross_minor:25000,fee_minor:750,refund_minor:5000,matched:true},
 {business:'KIN',date:'2026-10-15',gross_minor:10900,fee_minor:330,refund_minor:0,matched:true},
 {business:'VEL',date:'2026-10-20',gross_minor:45000,fee_minor:1400,refund_minor:0,matched:true}
]);
const business=document.getElementById('business');
const period=document.getElementById('report-period');
const currency=n=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(n/100);
const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
function renderReporting(){
 const result=summarise(synthetic,{business:business.value,period:period.value});
 const t=result.total;
 set('report-gross',currency(t.gross_minor));
 set('report-fees',currency(t.fee_minor));
 set('report-refunds',currency(t.refund_minor));
 set('report-net',currency(t.net_minor));
 const body=document.getElementById('report-rows');
 body.replaceChildren();
 const add=(name,r,isGroup=false)=>{
  const tr=document.createElement('tr');
  for(const value of [name,String(r.count),currency(r.gross_minor),currency(r.fee_minor),currency(r.refund_minor),currency(r.net_minor),String(r.unmatched_count)]){
   const td=document.createElement('td');td.textContent=value;if(isGroup)td.style.fontWeight='700';tr.appendChild(td);
  }body.appendChild(tr);
 };
 for(const [code,row] of Object.entries(result.byBusiness)){
  if(business.value==='all'||business.value===code)add(BUSINESS_LABELS[code],row);
 }
 if(business.value==='all')add('GROUP TOTAL',t,true);
 return result;
}
business.addEventListener('change',renderReporting);
period.addEventListener('change',renderReporting);
document.getElementById('report-export').addEventListener('click',()=>{
 const report=renderReporting();
 const blob=new Blob(['\ufeff'+reportCsv(report)],{type:'text/csv;charset=utf-8'});
 const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download='finance-DEMO-'+period.value+'-'+business.value+'.csv';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
 set('report-export-result','Synthetic CSV exported. Not valid for bookkeeping.');
});
renderReporting();
