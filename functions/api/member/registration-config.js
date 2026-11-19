import {reply,ready} from './_auth.js';
// Public configuration endpoint exposes only the site key and a fail-closed readiness flag.
export function onRequestGet({env}){
 const enabled=env?.PUBLIC_REGISTRATION_ENABLED==='true'&&ready(env)&&
 typeof env?.TURNSTILE_SECRET_KEY==='string'&&env.TURNSTILE_SECRET_KEY.length>0&&
 typeof env?.TURNSTILE_SITE_KEY==='string'&&/^[a-zA-Z0-9_-]{8,128}$/.test(env.TURNSTILE_SITE_KEY)&&
 typeof env?.RESEND_API_KEY==='string'&&env.RESEND_API_KEY.startsWith('re_')&&
 typeof env?.REGISTRATION_FROM_EMAIL==='string'&&env.REGISTRATION_FROM_EMAIL.includes('@');
 return reply(enabled?{available:true,turnstileSiteKey:env.TURNSTILE_SITE_KEY}:{available:false});
}
