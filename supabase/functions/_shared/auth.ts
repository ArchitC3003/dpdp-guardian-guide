import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export type AuthResult =
  | { ok: true; user: User; client: SupabaseClient }
  | { ok: false; response: Response };

const deny = (status: number, error: string, cors: Record<string, string>) =>
  new Response(JSON.stringify({ error }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

/**
 * Resolve the signed-in caller from the request's bearer token.
 * The publishable/anon key is not a user session and is rejected, so paid or
 * privileged functions cannot be driven by anyone who merely knows the key.
 * `client` runs as the caller, so RLS applies to anything read through it.
 */
export async function requireUser(
  req: Request,
  cors: Record<string, string>,
  opts: { roles?: string[] } = {},
): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+/i.test(authHeader)) {
    return { ok: false, response: deny(401, "Sign in required.", cors) };
  }

  const client = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
    {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );

  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    return { ok: false, response: deny(401, "Sign in required.", cors) };
  }

  if (opts.roles?.length) {
    const checks = await Promise.all(
      opts.roles.map((role) => client.rpc("current_user_has_role", { _role: role })),
    );
    if (!checks.some((c) => c.data === true)) {
      return { ok: false, response: deny(403, "Forbidden", cors) };
    }
  }

  return { ok: true, user, client };
}

/** True when the request carries the service-role key (trusted server-to-server call). */
export function isServiceRoleRequest(req: Request): boolean {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!key || token.length !== key.length) return false;
  let diff = 0;
  for (let i = 0; i < key.length; i++) diff |= key.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

/** Mask an email for logs: "jane.doe@example.com" -> "j***@example.com". */
export function maskEmail(email: unknown): string {
  if (typeof email !== "string") return "[none]";
  const at = email.lastIndexOf("@");
  if (at < 1) return "[redacted]";
  return `${email[0]}***${email.slice(at)}`;
}
