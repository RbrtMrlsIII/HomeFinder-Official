/* Profile subscription mount. PayPal approval is not entitlement authority. */
import { mountSubscriptionButton } from "../subscription.js";
import { getRole } from "./role.js";
const mount = document.getElementById("paypal-subscription-mount");
const status = document.getElementById("subscription-status");
function setStatus(text,state=""){ if(status){status.textContent=text||""; status.dataset.state=state;} }
async function boot(){
 if(!mount)return; const role=await getRole();
 if(!["owner","seeker","broker"].includes(role)){mount.closest(".subscription-entry")?.remove();return;}
 try{await mountSubscriptionButton("#paypal-subscription-mount");setStatus("PayPal approval is verified server-side before subscription benefits become active.","ready");}
 catch(err){console.warn("subscription mount",err);setStatus("Subscription checkout is unavailable right now. Please try again later.","error");}
}
document.addEventListener("homefinder:subscription-status",e=>{const d=e.detail||{};const labels={pending_verification:"Payment approved. Subscription is pending trusted verification.",cancelled:"Subscription checkout cancelled.",error:"PayPal subscription checkout reported an error."};setStatus(labels[d.status]||`Subscription status: ${d.status||"pending"}.`,d.status||"pending");});
boot();
