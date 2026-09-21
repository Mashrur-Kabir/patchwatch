import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@patchwatch/db";
import { processInstallation } from "@/lib/process-installation";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const signatureHeader = req.headers.get("x-hub-signature-256") ?? "";
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    console.error("[Webhook] GITHUB_WEBHOOK_SECRET is not set.");
    return new NextResponse("Server configuration error", { status: 500 });
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = "sha256=" + hmac.update(rawBody).digest("hex");

  if (signatureHeader.length !== digest.length) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const isValid = crypto.timingSafeEqual(
    Buffer.from(signatureHeader),
    Buffer.from(digest)
  );

  if (!isValid) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const eventType = req.headers.get("x-github-event");
  const deliveryId = req.headers.get("x-github-delivery");

  if (
    eventType === "pull_request" &&
    (payload.action === "opened" || payload.action === "synchronize")
  ) {
    const repoFullName = payload.repository?.full_name;
    const prNumber = payload.pull_request?.number;
    
    console.log(
      `[Webhook] Delivery ID: ${deliveryId} | Repo: ${repoFullName} | PR #${prNumber} | Action: ${payload.action}`
    );
  } else if (eventType === "installation_repositories") {
    const githubInstallationId = payload.installation?.id;
    if (githubInstallationId) {
      const installation = await prisma.installation.findUnique({
        where: { githubInstallationId }
      });

      if (installation) {
        console.log(`[Webhook] Syncing repos for installation ${githubInstallationId}`);
        
        // Handle removed repos right away
        const removed = payload.repositories_removed || [];
        if (removed.length > 0) {
          const removedRepoIds = removed.map((r: any) => r.id);
          await prisma.repository.updateMany({
            where: {
              githubRepoId: { in: removedRepoIds },
              installationId: installation.id,
            },
            data: { isActive: false },
          });
        }
        
        // The processInstallation helper will fetch the latest repos and upsert them (setting isActive: true)
        await processInstallation(githubInstallationId, installation.workspaceId);
      }
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}