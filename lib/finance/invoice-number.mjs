// Shared invoice identity contract. No customer data or secrets here.
// The numeric sequence MUST be allocated atomically in a durable database transaction.
// A caller-provided counter alone is NOT safe for concurrent issuance.
export const BUSINESS_CODES = Object.freeze({
  'oppel-enterprises': 'OPE',
  kindelora: 'KIN',
  velora: 'VEL',
  kindra: 'KDR',
  solelab: 'SOL'
});
export function formatInvoiceNumber({business, year, sequence}) {
  const code = BUSINESS_CODES[business];
  if (!code) throw new TypeError('Unknown business identifier');
  if (!Number.isInteger(year) || year < 2020 || year > 9999) throw new TypeError('Invalid invoice year');
  if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > 999999999) throw new TypeError('Invalid invoice sequence');
  return `${code}-${year}-${String(sequence).padStart(6,'0')}`;
}
export function parseInvoiceNumber(value) {
  if (typeof value !== 'string') throw new TypeError('Invalid invoice number');
  const match = /^(OPE|KIN|VEL|KDR|SOL)-(20[2-9][0-9]|[3-9][0-9]{3})-([0-9]{6,9})$/.exec(value);
  if (!match || Number(match[3]) < 1) throw new TypeError('Invalid invoice number');
  return {business:Object.keys(BUSINESS_CODES).find(k=>BUSINESS_CODES[k]===match[1]),year:Number(match[2]),sequence:Number(match[3])};
}
