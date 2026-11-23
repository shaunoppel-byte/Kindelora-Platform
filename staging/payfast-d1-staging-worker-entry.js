// Issue #806: staging-only Worker. No routes, no PayFast, no public test endpoint.
// The D1 batch harness is intentionally not invoked until the private runner gate exists.
export default {
 async fetch(){return new Response('Not found',{status:404,headers:{'cache-control':'no-store'}});}
};
