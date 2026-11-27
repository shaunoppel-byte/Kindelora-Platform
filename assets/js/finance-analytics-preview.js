import {summarise,BUSINESS_LABELS} from './finance-reporting-engine.js';
// This page contains no real ledger data. Production MUST query authenticated server endpoints.
const demo=[
{business:'OPE',date:'2026-11-02',gross_minor:149900,fee_minor:4300,refund_minor:0,matched:true},
{business:'KIN',date:'2026-11-05',gross_minor:12900,fee_minor:400,refund_minor:0,matched:false},
{business:'VEL',date:'2026-11-08',gross_minor:39900,fee_minor:1200,refund_minor:0,matched:true},
{business:'KDR',date:'2026-11-10',gross_minor:17900,fee_minor:550,refund_minor:0,matched:false},
{business:'SOL',date:'2026-11-12',gross_minor:25000,fee_minor:750,refund_minor:5000,matched:true},
{business:'KIN',date:'2026-10-15',gross_minor:10900,fee_minor:330,refund_minor:0,matched:true},
{business:'VEL',date:'2026-10-20',gross_minor:45000,fee_minor:1400,refund_minor:0,matched:true}
];
const palette=['#d9b56a','#79b9e8','#9f91e8','#77c6a9','#e49a83'];
const codes=Object.keys(BUSINESS_LABELS);
const currency=n=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(n/100);
const formatPct=n=>new Intl.NumberFormat('en-ZA',{style:'percent',maximumFractionDigits:1}).format(n);
const set=(id,value)=>{document.getElementById(id).textContent=value};
function addText(parent,tag,text,className){const e=document.createElement(tag);e.textContent=text;if(className)e.className=className;parent.appendChild(e);return e;}
function addBar(container,label,value,max,color){
 const line=addText(container,'div','', 'analytics-line');
 addText(line,'span',label);addText(line,'strong',currency(value));
 const bar=addText(container,'div','','analytics-bar');
 const fill=document.createElement('span');fill.style.width=(max?100*value/max:0)+'%';fill.style.background=color;bar.appendChild(fill);
}
function render(){
 const selected=document.getElementById('business').value;
 const period=document.getElementById('analytics-period').value;
 const rows=demo.filter(r=>selected==='all'||r.business===selected);
 const r=summarise(rows,{period}),t=r.total;
 for(const [id,v] of [['analytics-gross',t.gross_minor],['analytics-fees',t.fee_minor],['analytics-refunds',t.refund_minor],['analytics-net',t.net_minor]])set(id,currency(v));
 const bars=document.getElementById('analytics-bars'),legend=document.getElementById('analytics-legend'),table=document.getElementById('analytics-table'),donut=document.getElementById('analytics-donut');
 bars.replaceChildren();legend.replaceChildren();table.replaceChildren();
 const total=t.gross_minor;let offset=0;const stops=[];
 codes.forEach((code,i)=>{
  if(selected!=='all'&&selected!==code)return;
  const b=r.byBusiness[code],share=total?b.gross_minor/total:0;
  addBar(bars,BUSINESS_LABELS[code],b.gross_minor,total,palette[i]);
  const item=addText(legend,'div','');
  const sw=addText(item,'span','','analytics-swatch');sw.style.background=palette[i];
  addText(item,'span',BUSINESS_LABELS[code]+' · '+formatPct(share));
  if(share>0){stops.push(palette[i]+' '+offset+'% '+(offset+share*100)+'%');offset+=share*100;}
  const tr=document.createElement('tr');
  [BUSINESS_LABELS[code],b.count,currency(b.gross_minor),currency(b.fee_minor),currency(b.refund_minor),currency(b.net_minor),b.unmatched_count].forEach(v=>addText(tr,'td',String(v)));
  table.appendChild(tr);
 });
 if(selected==='all'){
  const tr=document.createElement('tr');
  ['GROUP TOTAL',t.count,currency(t.gross_minor),currency(t.fee_minor),currency(t.refund_minor),currency(t.net_minor),t.unmatched_count].forEach(v=>{const td=addText(tr,'td',String(v));td.style.fontWeight='700';});
  table.appendChild(tr);
 }
 donut.style.background=stops.length?'conic-gradient('+stops.join(',')+')':'#34415a';
 donut.setAttribute('aria-label',total?'Gross receipts share: '+codes.filter(c=>selected==='all'||c===selected).map(c=>BUSINESS_LABELS[c]+' '+formatPct(r.byBusiness[c].gross_minor/total)).join(', '):'No demo receipts for selected period');
 const trend=document.getElementById('analytics-trend');trend.replaceChildren();
 const months=['2026-10','2026-11'];const vals=months.map(p=>summarise(rows,{period:p}).total.gross_minor);const max=Math.max(...vals,1);
 months.forEach((p,i)=>addBar(trend,p==='2026-10'?'October 2026':'November 2026',vals[i],max,palette[i]));
 const checks=document.getElementById('analytics-checks');checks.replaceChildren();
 for(const line of [
  'Unmatched transactions: '+t.unmatched_count+' / '+t.count,
  'Gross less fees and refunds: '+currency(t.net_minor),
  'Arithmetic integrity: '+(t.gross_minor-t.fee_minor-t.refund_minor===t.net_minor?'PASS':'FAIL'),
  'Confirmed bank balance: NOT CONNECTED',
  'Last updated: static demonstration dataset'
 ])addText(checks,'div',line,'analytics-stat');
 set('analytics-refresh-status','Demo snapshot recalculated');
}
document.getElementById('business').addEventListener('change',render);
document.getElementById('analytics-period').addEventListener('change',render);
document.getElementById('analytics-refresh').addEventListener('click',render);
render();

for(const kind of ['gross','fees','refunds','net'])window.financeDrilldown('analytics-'+kind,()=>{const p=document.getElementById('analytics-period'),b=document.getElementById('business').value;return {period:p.selectedOptions[0].text,headers:['Business','Date','Gross','Fees','Refunds','Expected net','Reconciliation'],rows:demo.filter(x=>(b==='all'||x.business===b)&&(p.value==='all'||x.date.startsWith(p.value))&&(kind!=='refunds'||x.refund_minor!==0)&&(kind!=='fees'||x.fee_minor!==0)).map(x=>[BUSINESS_LABELS[x.business],x.date,currency(x.gross_minor),currency(x.fee_minor),currency(x.refund_minor),currency(x.gross_minor-x.fee_minor-x.refund_minor),x.matched?'Matched':'Pending'])};});
