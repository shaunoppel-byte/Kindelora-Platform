import {summarise,BUSINESS_LABELS} from './reporting.mjs';
// Deterministic read-only intent engine. Production must provide authenticated,
// server-authorised business-filtered ledger rows; NEVER use browser role claims.
export function answerFinanceQuery({question,rows,allowedBusinesses,period='all'}={}){
 if(typeof question!=='string'||question.length>1000||!Array.isArray(allowedBusinesses)||!Array.isArray(rows))throw new TypeError('Invalid assistant request');
 const permitted=[...new Set(allowedBusinesses)].filter(x=>Object.hasOwn(BUSINESS_LABELS,x));
 if(!permitted.length)return {status:'denied',answer:'No authorised financial workspaces are available.',data:null};
 const q=question.trim().toLowerCase();
 const explicit=Object.entries(BUSINESS_LABELS).filter(([code,name])=>q.includes(name.toLowerCase())||new RegExp('\\b'+code.toLowerCase()+'\\b').test(q)).map(([code])=>code);
 if(explicit.some(code=>!permitted.includes(code)))return {status:'denied',answer:'You are not authorised to access the requested business.',data:null};
 const scope=explicit.length?explicit:permitted;
 const safe=rows.filter(r=>scope.includes(r.business));
 const report=summarise(safe,{period});
 const t=report.total;
 const money=n=>new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR'}).format(n/100);
 const scopeName=explicit.length?explicit.map(c=>BUSINESS_LABELS[c]).join(', '):scope.length===5?'Group':scope.map(c=>BUSINESS_LABELS[c]).join(', ');
 const prefix='DEMONSTRATION ONLY — '+scopeName+' ('+(period==='all'?'all demo periods':period)+'): ';
 if(/(email|send|schedule|remind|export pdf|download pdf)/.test(q))return {status:'requires_integration',answer:'Sending or scheduling reports requires authenticated delivery, recipient verification and an auditable outbox. No email has been sent.',data:null};
 if(/(issue refund|process refund|refund customer|transfer funds|change bank detail|change access|invite user|delete record|adjust ledger)/.test(q))return {status:'denied',answer:'This assistant is read-only and cannot execute financial or access-control changes.',data:null};
 if(/(unmatch|reconcil|exception|outstanding)/.test(q))return {status:'answered',answer:prefix+t.unmatched_count+' of '+t.count+' transactions are awaiting reconciliation. This is a transaction count, not an outstanding monetary balance.',data:{unmatched_count:t.unmatched_count,count:t.count}};
 if(/(fee|charge|cost)/.test(q))return {status:'answered',answer:prefix+'processing fees '+money(t.fee_minor)+'.',data:{fee_minor:t.fee_minor}};
 if(/(refund)/.test(q))return {status:'answered',answer:prefix+'refunds '+money(t.refund_minor)+'.',data:{refund_minor:t.refund_minor}};
 if(/(net|settlement)/.test(q))return {status:'answered',answer:prefix+'expected net settlement '+money(t.net_minor)+' (gross minus fees and refunds). Not a confirmed bank deposit.',data:{net_minor:t.net_minor}};
 if(/(breakdown|contribut|business|compare|report|overview|revenue|receipt|payment|gross|total|how much)/.test(q)){
  const detail=Object.entries(report.byBusiness).filter(([code,v])=>scope.includes(code)&&v.count>0).map(([code,v])=>BUSINESS_LABELS[code]+': '+money(v.gross_minor)).join('; ');
  return {status:'answered',answer:prefix+'gross payments '+money(t.gross_minor)+' across '+t.count+' demo transactions; fees '+money(t.fee_minor)+'; refunds '+money(t.refund_minor)+'; expected net '+money(t.net_minor)+'.'+(detail?' Gross by business: '+detail+'.':''),data:{...t,byBusiness:report.byBusiness}};
 }
 return {status:'unsupported',answer:'I can demonstrate gross payments, business breakdowns, fees, expected net settlements and reconciliation counts. Live AI analysis, voice and email require secure integration.',data:null};
}
