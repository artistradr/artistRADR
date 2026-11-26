// Calls to the paystack Edge Function. The price is read on the server,
// so only the campaign id or the payment reference is ever sent.
import { supabase } from "../../supabaseClient"; // relative: no Vite alias covers top-level src/ files

const CHECKOUT_PREFIX = "https://checkout.paystack.com/";

async function callPaystack(body) {
  const { data, error } = await supabase.functions.invoke("paystack", { body });
  if (!error) return data;
  // The function explains failures in the response body.
  const details = await error.context?.json?.().catch(() => null);
  throw new Error(details?.error || "Couldn't reach the payment service. Please try again.");
}

// Sends the browser to Paystack's checkout page.
export async function goToCheckout(campaignId) {
  const data = await callPaystack({ action: "init", campaign_id: campaignId });
  const url = data?.authorization_url;
  if (!url?.startsWith(CHECKOUT_PREFIX)) throw new Error("Paystack didn't return a checkout link.");
  window.location.assign(url);
}

export async function verifyPayment(reference) {
  const data = await callPaystack({ action: "verify", reference });
  return data?.status ?? "pending";
}

// Removes an unpaid campaign. The server refuses if it has been paid.
export async function removeCampaign(campaignId) {
  await callPaystack({ action: "delete", campaign_id: campaignId });
}
