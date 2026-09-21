import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

/**
 * Build an Octokit client authenticated as a GitHub App installation.
 *
 * Key normalisation handles every form the private key might arrive in:
 *   - Surrounding quotes (some .env parsers leave them in)
 *   - Escaped \n literals  (e.g. stored as a single-line JSON string)
 *   - Windows \r\n endings (Next.js on Windows reads .env with CRLF)
 *
 * The RSA PEM parser inside @octokit/auth-app is strict: it rejects \r.
 */
export function getInstallationOctokit(installationId: number): Octokit {
  const rawKey = process.env.GITHUB_APP_PRIVATE_KEY ?? "";

  const privateKey = rawKey
    .replace(/^["']|["']$/g, "")   // strip surrounding quotes
    .replace(/\\n/g, "\n")          // unescape literal \n sequences
    .replace(/\r\n/g, "\n")         // normalise Windows CRLF -> LF
    .replace(/\r/g, "\n");          // normalise lone \r -> LF

  if (!privateKey.includes("BEGIN")) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY is missing or malformed. " +
        "Check .env.local — the value must be a PEM RSA private key."
    );
  }

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey,
      installationId,
    },
  });
}

/**
 * Returns the list of repositories accessible to this installation.
 */
export async function listInstallationRepos(installationId: number) {
  const octokit = getInstallationOctokit(installationId);
  const { data: installationRepos } =
    await octokit.rest.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });
  
  return installationRepos.repositories;
}