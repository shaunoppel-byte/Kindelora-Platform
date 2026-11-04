// Authenticated subscription endpoints must not be simulated with client state.
function unavailable(){return new Response(JSON.stringify({error:"authentication_not_configured",message:"Secure subscriber account management is not yet available."}),{status:503,headers:{"content-type":"application/json","cache-control":"no-store"}})}
export async function onRequestGet(){return unavailable()}
export async function onRequestPost(){return unavailable()}
