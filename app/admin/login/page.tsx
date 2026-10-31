import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-[380px] glass-strong rounded-[26px] p-8">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-lg bg-ink font-display text-[13px] font-extrabold text-paper">
            SA
          </span>
          <div>
            <h1 className="font-display text-lg font-extrabold leading-tight">Admin</h1>
            <p className="text-sm text-muted">Sign in to manage the site</p>
          </div>
        </div>
        <Suspense fallback={<LoginForm />}>
          <Next searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Next({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const { next } = await searchParams;
  return <LoginForm next={typeof next === "string" ? next : undefined} />;
}
