import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/supabase/auth";

export const metadata = {
  title: "Admin | PXF Analytics",
};

export default async function AdminPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?redirect=/admin");
  if (profile.role !== "admin") {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">403 — Admins only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account ({profile.email}) does not have admin access.
        </p>
      </div>
    );
  }

  // RLS lets admins read every profile row.
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, created_at")
    .order("created_at", { ascending: false });
  const users = (data as Profile[]) ?? [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Admin · Users</h1>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">{u.role}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {u.created_at?.slice(0, 10)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
