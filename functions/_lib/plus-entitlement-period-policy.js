// Pure PLUS entitlement period policy. Does NOT activate membership or charge.
// Caller must supply a transaction independently authenticated with PayFast,
// durably recorded and bound to the verified customer before applying any result.
const deny=reason=>({ok:false,reason,grantEntitlement:false});
export function calculatePlusEntitlementPeriod({plan,paidAt,previousPeriodEnd=null}={}){
 if(!['monthly','annual'].includes(plan)||typeof paidAt!=='string'||
  !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(paidAt))return deny('invalid_payment_period');
 const paidMs=Date.parse(paidAt);
 if(!Number.isFinite(paidMs)||new Date(paidMs).toISOString()!==paidAt)return deny('invalid_payment_date');
 let startMs=paidMs;
 if(previousPeriodEnd!==null){
  if(typeof previousPeriodEnd!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(previousPeriodEnd))return deny('invalid_previous_period');
  const previousMs=Date.parse(previousPeriodEnd);
  if(!Number.isFinite(previousMs)||new Date(previousMs).toISOString()!==previousPeriodEnd)return deny('invalid_previous_period');
  startMs=Math.max(startMs,previousMs);
 }
 const start=new Date(startMs);
 const months=plan==='monthly'?1:12;
 // Calendar-month billing with end-of-month clamping, not fixed 30/365-day periods.
 const targetMonth=start.getUTCMonth()+months;
 const year=start.getUTCFullYear()+Math.floor(targetMonth/12);
 const month=targetMonth%12;
 const lastDay=new Date(Date.UTC(year,month+1,0)).getUTCDate();
 const day=Math.min(start.getUTCDate(),lastDay);
 const end=new Date(Date.UTC(year,month,day,start.getUTCHours(),start.getUTCMinutes(),start.getUTCSeconds(),start.getUTCMilliseconds()));
 if(!Number.isFinite(end.getTime())||end.getTime()<=startMs)return deny('invalid_period');
 return {ok:true,plan,periodStart:new Date(startMs).toISOString(),periodEnd:end.toISOString(),grantEntitlement:false};
}
