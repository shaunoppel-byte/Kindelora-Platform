import assert from "node:assert/strict";
import {onRequestGet} from "../functions/api/member/me.js";
const response=await onRequestGet({
 request:new Request("https://kindelora.pages.dev/api/member/me"),
 env:{MEMBER_AUTH_ENABLED:"false"}
});
assert.equal(response.status,503);
assert.deepEqual(await response.json(),{authenticated:false,reason:"member_auth_not_configured"});
console.log("PASS: member access fails closed without backend configuration");
