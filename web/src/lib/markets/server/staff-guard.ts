// Server-only: staff authorization for market admin routes.
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type StaffResult =
  | { ok: true; userId: string | null; via: "secret" | "token" }
  | { ok: false; status: number; message: string };

/**
 * Gate market-admin routes to staff (promoter/admin). Two accepted credentials,
 * since the auth UI isn't built yet:
 *   1. `x-admin-secret` header matching MARKETS_ADMIN_SECRET (ops/local tooling).
 *   2. `Authorization: Bearer <supabase access token>` whose profile.role is staff.
 */
export async function requireStaff(req: Request): Promise<StaffResult> {
  const adminSecret = process.env.MARKETS_ADMIN_SECRET;
  const provided = req.headers.get("x-admin-secret");
  if (adminSecret && provided && provided === adminSecret) {
    return { ok: true, userId: null, via: "secret" };
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return { ok: false, status: 401, message: "Missing credentials (bearer token or x-admin-secret)." };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return { ok: false, status: 500, message: "Supabase env not configured." };
  }

  // A client scoped to the caller's token — RLS lets a user read their own profile.
  const client = createSupabaseClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userErr } = await client.auth.getUser();
  if (userErr || !userData.user) {
    return { ok: false, status: 401, message: "Invalid or expired token." };
  }

  const { data: profile, error: roleErr } = await client
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (roleErr) {
    return { ok: false, status: 500, message: "Could not verify role." };
  }
  if (!profile || !["promoter", "admin"].includes(profile.role)) {
    return { ok: false, status: 403, message: "Staff role required." };
  }

  return { ok: true, userId: userData.user.id, via: "token" };
}
