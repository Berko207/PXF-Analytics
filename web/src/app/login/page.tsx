import { login, signup } from "./actions";

export const metadata = {
  title: "Sign in | PXF Analytics",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string; redirect?: string };
}) {
  const { error, message, redirect } = searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-6 px-4">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">PXF Analytics</h1>
        <p className="text-sm text-muted-foreground">Sign in or create an account</p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          {message}
        </p>
      ) : null}

      <form className="flex flex-col gap-4">
        <input type="hidden" name="redirect" value={redirect ?? "/account"} />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="current-password"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="flex flex-col gap-2">
          <button
            formAction={login}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
          >
            Sign in
          </button>
          <button
            formAction={signup}
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium transition hover:bg-accent"
          >
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
