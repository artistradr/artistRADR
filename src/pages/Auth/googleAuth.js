// Starts Google sign-in with Supabase. The browser leaves the site for Google, then returns to
// `nextPath`. That address must be allowed under Authentication > URL Configuration > Redirect URLs
// in the Supabase dashboard, and the Google provider must be turned on there.
import { supabase } from "../../supabaseClient";

export async function signInWithGoogle(nextPath = "/") {
  // Only paths on this site, never another address.
  const path = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}${path}` },
  });
  if (error) throw error;
}
