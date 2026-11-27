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
 const fill=document.createElement('span');fill.style.width=(max?100*value/max:0)+'%';fill.style.background=color;bar.appendChild(fill);return line;
}

// Every chart mark uses the same modal, with exact selection and totals.
function drill(el,title,records,period,total){
 el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',title+' · '+total+' · View details');el.style.cursor='pointer';el.title=title+' · '+total+' · View details';
 const open=()=>window.financeOpenDetail(el,{title,period,total,headers:['Business','Date','Gross','Fees','Refunds','Expected net','Reconciliation'],rows:records.map(x=>[BUSINESS_LABELS[x.business],x.date,currency(x.gross_minor),currency(x.fee_minor),currency(x.refund_minor),currency(x.gross_minor-x.fee_minor-x.refund_minor),x.matched?'Matched':'Pending'])});
 el.addEventListener('click',open);el.addEventListener('keydown',e=>{if(el.tagName!=='BUTTON'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open();}});
}
function render(){
 const selected=document.getElementById('business').value;
 const period=document.getElementById('analytics-period').value;
 const rows=demo.filter(r=>selected==='all'||r.business===selected);
 const r=summarise(rows,{period}),t=r.total;
 for(const [id,v] of [['analytics-gross',t.gross_minor],['analytics-fees',t.fee_minor],['analytics-refunds',t.refund_minor],['analytics-net',t.net_minor]])set(id,currency(v));
 const bars=document.getElementById('analytics-bars'),legend=document.getElementById('analytics-legend'),table=document.getElementById('analytics-table'),donut=document.getElementById('analytics-donut');
 bars.replaceChildren();legend.replaceChildren();table.replaceChildren();
 const total=t.gross_minor;let offset=0;const stops=[],segments=[];
 codes.forEach((code,i)=>{
  if(selected!=='all'&&selected!==code)return;
  const b=r.byBusiness[code],share=total?b.gross_minor/total:0;
  const detail=r.rows.filter(x=>x.business===code);const mark=addBar(bars,BUSINESS_LABELS[code],b.gross_minor,total,palette[i]);drill(mark,BUSINESS_LABELS[code]+' gross receipts',detail,period,currency(b.gross_minor));drill(mark.nextElementSibling,BUSINESS_LABELS[code]+' gross receipts',detail,period,currency(b.gross_minor));
  const item=addText(legend,'div','');
  const sw=addText(item,'span','','analytics-swatch');sw.style.background=palette[i];
  addText(item,'span',BUSINESS_LABELS[code]+' · '+formatPct(share));drill(item,BUSINESS_LABELS[code]+' contribution',detail,period,currency(b.gross_minor));
  if(share>0){stops.push(palette[i]+' '+offset+'% '+(offset+share*100)+'%');segments.push({end:offset+share*100,code,detail,total:currency(b.gross_minor)});offset+=share*100;}
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
 donut.style.cursor=segments.length?'pointer':'default';donut.onclick=e=>{const rect=donut.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2;const radius=Math.min(rect.width,rect.height)/2;if(Math.hypot(dx,dy)>radius)return;const angle=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;const seg=segments.find(x=>angle/3.6<x.end);if(seg)window.financeOpenDetail(donut,{title:BUSINESS_LABELS[seg.code]+' contribution',period,total:seg.total,headers:['Business','Date','Gross'],rows:seg.detail.map(x=>[BUSINESS_LABELS[x.business],x.date,currency(x.gross_minor)])});};donut.setAttribute('role','button');donut.tabIndex=0;donut.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();legend.querySelector('[role=button]')?.focus();}};
 const trend=document.getElementById('analytics-trend');trend.replaceChildren();
 const months=['2026-10','2026-11'];const vals=months.map(p=>summarise(rows,{period:p}).total.gross_minor);const max=Math.max(...vals,1);
 const monthly=months.map(p=>summarise(rows,{period:p}).total);
 const ceiling=Math.max(1,...monthly.map(x=>x.gross_minor));
 const chart=document.createElement('div');chart.style.cssText='display:flex;gap:20px;align-items:end;justify-content:space-around;min-height:210px;padding:12px 0';
 monthly.forEach((m,i)=>{const group=addText(chart,'div','');group.style.cssText='flex:1;min-width:0;text-align:center';const bars=addText(group,'div','');bars.style.cssText='height:160px;display:flex;align-items:end;justify-content:center;gap:8px;border-bottom:1px solid #52658b';for(const [label,v,color] of [['Gross',m.gross_minor,palette[0]],['Expected net',m.net_minor,palette[1]]]){const bar=addText(bars,'div','');bar.style.cssText='width:32%;max-width:64px;border-radius:6px 6px 0 0;background:'+color+';height:'+100*v/ceiling+'%';bar.title=label+': '+currency(v);drill(bar,months[i]+' '+label,rows.filter(x=>x.date.startsWith(months[i])),months[i],currency(v));bar.style.minHeight=v?'2px':'0';}addText(group,'strong',months[i]);addText(group,'div','Gross '+currency(m.gross_minor),'muted');addText(group,'div','Net '+currency(m.net_minor),'muted');});trend.append(chart);
 addText(trend,'p','Gold: gross receipts · Blue: expected net','muted');
 const prior=monthly[0].gross_minor,current=monthly[1].gross_minor;
 addText(trend,'strong',prior?'Gross month-on-month: '+formatPct((current-prior)/prior):'Gross month-on-month: unavailable (zero prior base)');
 addText(trend,'p','November demo snapshot vs October demo snapshot; not a like-for-like completed month comparison.','muted');
 const ratio=t.count?(t.count-t.unmatched_count)/t.count:0;
 const ring=addText(trend,'div','');ring.style.cssText='margin:20px auto 8px;width:116px;height:116px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#77c6a9 '+ratio*100+'%,#34415a 0)';const center=addText(ring,'strong',t.count?formatPct(ratio):'N/A');center.style.cssText='display:grid;place-items:center;width:88px;height:88px;border-radius:50%;background:#121c30;font-size:22px';addText(trend,'p','Demo reconciliation: '+(t.count-t.unmatched_count)+' of '+t.count+' matched','muted');for(const matched of [true,false]){const records=r.rows.filter(x=>x.matched===matched);const mark=addText(trend,'button',(matched?'Matched':'Pending')+' · '+records.length,'action');mark.type='button';drill(mark,matched?'Matched transactions':'Pending transactions',records,period,String(records.length));}ring.style.cursor='pointer';ring.onclick=e=>{const rect=ring.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2;if(Math.hypot(dx,dy)<44)return;const matched=((Math.atan2(dx,-dy)*180/Math.PI+360)%360)/360<ratio;const records=r.rows.filter(x=>x.matched===matched);window.financeOpenDetail(ring,{title:matched?'Matched transactions':'Pending transactions',period,total:String(records.length),headers:['Business','Date','Gross','Reconciliation'],rows:records.map(x=>[BUSINESS_LABELS[x.business],x.date,currency(x.gross_minor),matched?'Matched':'Pending'])});};ring.setAttribute('role','button');ring.setAttribute('aria-label','Reconciliation breakdown; use matched or pending controls for details');ring.tabIndex=0;ring.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();trend.querySelector('button')?.focus();}};
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
