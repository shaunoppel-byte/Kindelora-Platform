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

for(const kind of ['gross','fees','refunds','net'])window.financeDrilldown('report-'+kind,()=>{const p=document.getElementById('report-period'),b=document.getElementById('business').value;return {period:p.selectedOptions[0].text,headers:['Business','Date','Gross','Fees','Refunds','Expected net','Reconciliation'],rows:synthetic.filter(x=>(b==='all'||x.business===b)&&(p.value==='all'||x.date.startsWith(p.value))&&(kind!=='refunds'||x.refund_minor!==0)&&(kind!=='fees'||x.fee_minor!==0)).map(x=>[BUSINESS_LABELS[x.business],x.date,currency(x.gross_minor),currency(x.fee_minor),currency(x.refund_minor),currency(x.gross_minor-x.fee_minor-x.refund_minor),x.matched?'Matched':'Pending'])};});

import {makeFinancePdf} from './finance-pdf-preview.js';
function reportLines(){
 const report=renderReporting(),mode=document.getElementById('report-detail').value;
 const lines=['OPPEL ENTERPRISES GROUP','Financial performance report - DEMONSTRATION ONLY','Scope: '+business.selectedOptions[0].text,'Period: '+period.selectedOptions[0].text,'Generated: '+new Date().toISOString(),'Confidential management format - fictional records',''];
 const cash=n=>'ZAR '+(n/100).toFixed(2);
 if(mode!=='detail'){
 lines.push('EXECUTIVE SUMMARY','Gross: '+cash(report.total.gross_minor),'Fees: '+cash(report.total.fee_minor),'Refunds: '+cash(report.total.refund_minor),'Expected net: '+cash(report.total.net_minor),'Transactions: '+report.total.count+' | Unmatched: '+report.total.unmatched_count,'','BUSINESS CONTRIBUTION');
 for(const [code,v] of Object.entries(report.byBusiness))if(business.value==='all'||business.value===code)lines.push(BUSINESS_LABELS[code]+' | Gross '+cash(v.gross_minor)+' | Net '+cash(v.net_minor)+' | Count '+v.count);
 }
 if(mode!=='summary'){lines.push('','TRANSACTION DETAIL');for(const x of report.rows)lines.push(x.date+' | '+BUSINESS_LABELS[x.business]+' | Gross '+cash(x.gross_minor),'  Fees '+cash(x.fee_minor)+' | Refunds '+cash(x.refund_minor)+' | '+(x.matched?'Matched':'Unmatched'));}
 lines.push('','Not a tax or accounting statement. No live financial data.');
 return lines;
}
function reportUrl(){return URL.createObjectURL(new Blob([makeFinancePdf(reportLines())],{type:'application/pdf'}));}
document.getElementById('report-pdf').addEventListener('click',()=>{const url=reportUrl(),a=document.createElement('a');a.href=url;a.download='OE-finance-DEMO-'+business.value+'-'+period.value+'.pdf';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);set('report-pdf-status','Demo PDF generated.');});
document.getElementById('report-print').addEventListener('click',()=>{const url=reportUrl();const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';a.click();setTimeout(()=>URL.revokeObjectURL(url),600000);set('report-pdf-status','PDF opened in a new tab. Use the PDF viewer Print command.');});
