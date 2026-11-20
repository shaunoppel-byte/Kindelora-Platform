// Pure, offline PayFast canonicalization helpers. No network, credentials, or checkout activation.
// Hosted checkout uses the documented insertion order; REST uses sorted parameter names.
// Callers must supply the *correct* PayFast field set and signing context.
export function payfastEncode(value) {
  return encodeURIComponent(String(value)).replace(/%20/g, '+').replace(/%[0-9a-f]{2}/gi, m => m.toUpperCase());
}
function pairs(fields, sorted) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new TypeError('fields must be a plain key/value object');
  const entries = Object.entries(fields).filter(([key, value]) => {
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(key)) throw new TypeError('invalid field name');
    if (value !== null && value !== undefined && typeof value !== 'string' && typeof value !== 'number') throw new TypeError('invalid field value');
    return value !== null && value !== undefined && String(value).length > 0 && key !== 'signature';
  });
  if (sorted) entries.sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0);
  return entries.map(([key, value]) => key + '=' + payfastEncode(value));
}
export function hostedCheckoutSignatureInput(fields, passphrase = '') {
  if (typeof passphrase !== 'string') throw new TypeError('invalid passphrase');
  const items = pairs(fields, false);
  if (passphrase) items.push('passphrase=' + payfastEncode(passphrase));
  return items.join('&');
}
export function restApiSignatureInput(fields, passphrase = '') {
  if (typeof passphrase !== 'string') throw new TypeError('invalid passphrase');
  const items = pairs(fields, true);
  if (passphrase) items.push('passphrase=' + payfastEncode(passphrase));
  return items.join('&');
}
