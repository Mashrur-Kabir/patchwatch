import { prisma } from "./packages/db/src/index.js";
import { processInstallation } from "./apps/web/lib/process-installation.js";
import { config } from "dotenv";

config({ path: "./apps/web/.env.local" });

async function run() {
  try {
    const inst = await prisma.installation.findUnique({
      where: { githubInstallationId: 163395344 }
    });
    if (inst) {
      console.log("Found installation, syncing...");
      // But wait! process-installation imports from @patchwatch/github-client which is TypeScript.
      // Running it directly via node might not work unless we use tsx.
    }
  } catch (e) {
    console.error(e);
  }
}
run();