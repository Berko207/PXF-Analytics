import { redirect } from "next/navigation";

import { signout } from "@/app/login/actions";
import { getProfile } from "@/lib/supabase/auth";

export const metadata = {
  title: "Account | PXF Analytics",
};

export default async function AccountPage() {
  const profile = await getProfile();
  if (!profile) redirect("/login?redirect=/account");

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>

      <dl className="grid grid-cols-[8rem_1fr] gap-y-3 rounded-lg border border-border p-5 text-sm">
        <dt className="text-muted-foreground">Email</dt>
        <dd>{profile.email}</dd>
        <dt className="text-muted-foreground">Role</dt>
        <dd>
          <span className="rounded-full border border-border px-2 py-0.5 text-xs uppercase tracking-wide">
            {profile.role}
          </span>
        </dd>
      </dl>

      {profile.role === "admin" ? (
        <a href="/admin" className="text-sm font-medium text-primary hover:underline">
          Go to admin dashboard →
        </a>
      ) : null}

      <form action={signout}>
        <button className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition hover:bg-accent">
          Sign out
        </button>
      </form>
    </div>
  );
}
