import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { NextRequest } from "next/server";
import { prisma } from "@patchwatch/db";
import { authOptions } from "@/lib/auth";
import { processInstallation } from "@/lib/process-installation";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/");

  const installationIdStr = req.nextUrl.searchParams.get("installation_id");
  if (!installationIdStr) redirect("/dashboard");

  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { workspace: { createdAt: "asc" } },
  });
  if (!membership) redirect("/dashboard");

  try {
    await processInstallation(parseInt(installationIdStr, 10), membership.workspaceId);
  } catch (error) {
    console.error("[GitHub Callback] Failed to process installation:", error);
  }

  redirect("/dashboard");
}