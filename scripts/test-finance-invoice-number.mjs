import assert from 'node:assert/strict';
import {BUSINESS_CODES,formatInvoiceNumber,parseInvoiceNumber} from '../lib/finance/invoice-number.mjs';
const expected = {
 'oppel-enterprises':'OPE-2026-000001',
 kindelora:'KIN-2026-000001',
 velora:'VEL-2026-000001',
 kindra:'KDR-2026-000001',
 solelab:'SOL-2026-000001'
};
const numbers=Object.entries(expected).map(([business,invoice])=>{
 const value=formatInvoiceNumber({business,year:2026,sequence:1});
 assert.equal(value,invoice);
 assert.deepEqual(parseInvoiceNumber(value),{business,year:2026,sequence:1});
 return value;
});
assert.equal(new Set(numbers).size,Object.keys(BUSINESS_CODES).length);
assert.equal(formatInvoiceNumber({business:'velora',year:2027,sequence:1000000}),'VEL-2027-1000000');
for(const data of [{business:'unknown',year:2026,sequence:1},{business:'kindra',year:2026,sequence:0},{business:'kindra',year:2026,sequence:1.1},{business:'kindra',year:2026,sequence:Infinity},{business:'kindra',year:2000,sequence:1}]) assert.throws(()=>formatInvoiceNumber(data));
for(const value of ['KIN-2026-000000','KIN-2026-1','VEL-2026-000001-extra','OPE-2026-000001/../../','ABC-2026-000001'])assert.throws(()=>parseInvoiceNumber(value));
console.log('PASS: 5 unique business prefixes, validation, year/sequence and round-trip tests');
