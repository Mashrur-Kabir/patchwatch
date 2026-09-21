import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@patchwatch/db";
import { processInstallation } from "@/lib/process-installation";
import SignOutButton from "@/components/sign-out-button";

interface DashboardPageProps {
  searchParams: Promise<{ installation_id?: string; setup_action?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getServerSession(authOptions);
  const params = await searchParams;

  // ── Handle GitHub App redirect: /dashboard?installation_id=xxx ──────────
  // GitHub may redirect here instead of /api/github/install/callback
  // depending on the App's "Setup URL" setting. We handle both.
  if (session && params.installation_id) {
    const githubInstallationId = parseInt(params.installation_id, 10);
    if (!isNaN(githubInstallationId)) {
      const membership = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        orderBy: { workspace: { createdAt: "asc" } },
      });
      if (membership) {
        try {
          await processInstallation(githubInstallationId, membership.workspaceId);
        } catch (error) {
          console.error("[Dashboard] Failed to process GitHub installation:", error);
          // It will fall through and redirect to /dashboard to clear the URL,
          // preventing an infinite hang loop on reload.
        }
      }
    }
    // Redirect to the clean URL so refreshing doesn't re-trigger the upsert
    redirect("/dashboard");
  }

  if (!session) {
    redirect("/");
  }

  // Find the user's primary workspace + its installation + repos.
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id, role: "OWNER" },
    include: {
      workspace: {
        include: {
          installation: {
            include: {
              repositories: {
                orderBy: { fullName: "asc" },
              },
            },
          },
        },
      },
    },
    orderBy: { workspace: { createdAt: "asc" } },
  });

  const workspace = membership?.workspace;
  const installation = workspace?.installation ?? null;
  const repos = installation?.repositories ?? [];
  const appSlug = process.env.GITHUB_APP_SLUG ?? "";
  const connectUrl = `https://github.com/apps/${appSlug}/installations/new`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex w-full max-w-lg flex-col gap-6 rounded-2xl border border-zinc-200 bg-white px-10 py-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome, {session.user.name ?? session.user.email}
          </h1>
          {workspace && (
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {workspace.name}
            </p>
          )}
        </div>

        {/* GitHub connection section */}
        {!installation ? (
          <div className="flex flex-col gap-3 rounded-xl border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Connect a GitHub organization or repository to start scanning pull
              requests.
            </p>
            <a
              href={connectUrl}
              className="inline-flex items-center gap-2 self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-4 w-4 fill-current"
              >
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              Connect GitHub
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                Connected repositories
              </h2>
              <a
                href={connectUrl}
                className="text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
              >
                Manage
              </a>
            </div>
            {repos.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No repositories found in this installation.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-700">
                {repos.map((repo) => (
                  <li
                    key={repo.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {repo.fullName}
                    </span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {repo.defaultBranch}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <SignOutButton />
      </div>
    </main>
  );
}