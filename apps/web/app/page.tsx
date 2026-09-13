import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import SignInButton from "@/components/sign-in-button";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-8 rounded-2xl border border-zinc-200 bg-white px-10 py-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            PatchWatch
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Automatic security scanning for your pull requests
          </p>
        </div>
        <SignInButton />
      </div>
    </main>
  );
}