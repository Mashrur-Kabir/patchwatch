import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@patchwatch/db";
import SignOutButton from "@/components/sign-out-button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Find the user's primary workspace (the one they own, created at sign-up).
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, role: "OWNER" },
    include: { workspace: true },
    orderBy: { workspace: { createdAt: "asc" } },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white px-10 py-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome, {session.user.name ?? session.user.email}
          </h1>
          {membership && (
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {membership.workspace.name}
            </p>
          )}
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You are signed in. The dashboard is coming soon.
          </p>
        </div>
        <SignOutButton />
      </div>
    </main>
  );
}