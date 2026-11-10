import { supabase } from "@/integrations/supabase/client";

/**
 * Headers for calling a protected backend function with fetch().
 * Functions reject the publishable key on its own, so the signed-in user's
 * access token must be sent. Throws when nobody is signed in.
 */
export async function functionAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Please sign in to use this feature.");
  }
  return {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${session.access_token}`,
  };
}
