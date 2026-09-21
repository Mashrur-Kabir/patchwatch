import { prisma } from "@patchwatch/db";
import { getInstallationOctokit } from "@/lib/github-app";

/**
 * Given a GitHub installation ID and the workspaceId to link it to,
 * upsert the Installation row and all its Repository rows.
 * Called from both the dedicated callback route AND the dashboard page
 * (GitHub may redirect to either depending on the App's Setup URL setting).
 */
export async function processInstallation(
  githubInstallationId: number,
  workspaceId: string
): Promise<void> {
  const octokit = getInstallationOctokit(githubInstallationId);

  const { data: installationRepos } =
    await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

  // Upsert the Installation row first so we have its internal id.
  const installation = await prisma.installation.upsert({
    where: { githubInstallationId },
    update: { workspaceId },
    create: { githubInstallationId, workspaceId },
  });

  // Upsert each Repository row.
  await Promise.all(
    installationRepos.repositories.map((repo) =>
      prisma.repository.upsert({
        where: { githubRepoId: repo.id },
        update: {
          fullName: repo.full_name,
          defaultBranch: repo.default_branch,
          isActive: true,
          installationId: installation.id,
        },
        create: {
          githubRepoId: repo.id,
          fullName: repo.full_name,
          defaultBranch: repo.default_branch,
          isActive: true,
          installationId: installation.id,
        },
      })
    )
  );
}