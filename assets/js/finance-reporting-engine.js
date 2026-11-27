// Finance reporting contract. Pure functions, integer minor units; never use browser demo data in production.
// Call only after authenticated server-side business-scope filtering.
export const BUSINESS_LABELS=Object.freeze({OPE:'Oppel Enterprises',KIN:'KINDELORA',VEL:'VELORA',KDR:'KINDRA',SOL:'SOLELAB'});
export function summarise(rows,{business='all',period='all'}={}){
 if(!Array.isArray(rows))throw new TypeError('Rows required');
 if(business!=='all'&&!Object.hasOwn(BUSINESS_LABELS,business))throw new TypeError('Unknown business');
 if(period!=='all'&&!/^\d{4}-\d{2}$/.test(period))throw new TypeError('Invalid period');
 const chosen=rows.filter(r=>{
  if(!r||!Object.hasOwn(BUSINESS_LABELS,r.business)||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isSafeInteger(r.gross_minor)||r.gross_minor<0||!Number.isSafeInteger(r.fee_minor)||r.fee_minor<0||!Number.isSafeInteger(r.refund_minor)||r.refund_minor<0||r.fee_minor+r.refund_minor>r.gross_minor||typeof r.matched!=='boolean')throw new TypeError('Invalid finance row');
  return (business==='all'||r.business===business)&&(period==='all'||r.date.startsWith(period));
 });
 const empty=()=>({count:0,gross_minor:0,fee_minor:0,refund_minor:0,net_minor:0,unmatched_count:0});
 const total=empty(),byBusiness=Object.fromEntries(Object.keys(BUSINESS_LABELS).map(k=>[k,empty()]));
 for(const r of chosen)for(const a of [total,byBusiness[r.business]]){
  a.count++;a.gross_minor+=r.gross_minor;a.fee_minor+=r.fee_minor;a.refund_minor+=r.refund_minor;a.net_minor+=r.gross_minor-r.fee_minor-r.refund_minor;a.unmatched_count+=Number(!r.matched);
  for(const k of ['gross_minor','fee_minor','refund_minor','net_minor'])if(!Number.isSafeInteger(a[k]))throw new RangeError('Reporting total exceeds safe integer');
 }
 return {total,byBusiness,rows:chosen,business};
}
export function csvCell(value){const s=String(value??'');const guarded=/^[\s]*[=+@-]/.test(s)?"'"+s:s;return '"'+guarded.replaceAll('"','""')+'"';}
export function reportCsv(report){
 const header=['Business','Transactions','Gross minor units','Fees minor units','Refunds minor units','Net minor units','Unmatched'];
 const lines=[header.map(csvCell).join(',')];
 for(const [code,v] of Object.entries(report.byBusiness))if(!report.business||report.business==='all'||report.business===code)lines.push([code,v.count,v.gross_minor,v.fee_minor,v.refund_minor,v.net_minor,v.unmatched_count].map(csvCell).join(','));
 const t=report.total;if(!report.business||report.business==='all')lines.push(['GROUP',t.count,t.gross_minor,t.fee_minor,t.refund_minor,t.net_minor,t.unmatched_count].map(csvCell).join(','));
 return lines.join('\r\n')+'\r\n';
}
