import assert from 'node:assert/strict';
import {summarise,reportCsv,csvCell} from '../lib/finance/reporting.mjs';
const rows=[
 {business:'KIN',date:'2026-11-01',gross_minor:10000,fee_minor:250,refund_minor:0,matched:true},
 {business:'VEL',date:'2026-11-02',gross_minor:20000,fee_minor:500,refund_minor:2000,matched:false},
 {business:'KIN',date:'2026-10-01',gross_minor:5000,fee_minor:100,refund_minor:0,matched:false}
];
const group=summarise(rows,{period:'2026-11'});
assert.deepEqual(group.total,{count:2,gross_minor:30000,fee_minor:750,refund_minor:2000,net_minor:27250,unmatched_count:1});
assert.equal(group.byBusiness.KIN.net_minor,9750);
assert.equal(group.byBusiness.VEL.net_minor,17500);
assert.equal(group.byBusiness.OPE.count,0);
assert.equal(summarise(rows,{business:'KIN',period:'2026-11'}).total.count,1);
assert.equal(summarise(rows,{business:'KIN'}).total.count,2);
assert.equal(summarise(rows,{period:'2025-01'}).total.count,0);
assert.throws(()=>summarise(rows,{business:'FAKE'}));
assert.throws(()=>summarise([{...rows[0],gross_minor:-1}]));
assert.throws(()=>summarise([{...rows[0],fee_minor:999999}]));
assert.ok(reportCsv(group).includes('"GROUP","2","30000"'));
assert.equal(csvCell('=HYPERLINK("bad")'),'"\'=HYPERLINK(""bad"")"');
console.log('PASS group aggregation, period and business drilldown, refunds, fees, unmatched, CSV injection');
