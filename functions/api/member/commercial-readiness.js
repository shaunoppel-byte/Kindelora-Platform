// Compatibility route for browsers still controlled by legacy PLUS service workers.
// Reuse the identical authenticated, read-only handler; no new permissions.
export {onRequestGet} from '../plus/schema-readiness.js';
