import { prisma, WorkspaceRole } from "@patchwatch/db";

/**
 * Looks up a user's membership in a specific workspace.
 * Returns the role (OWNER, ADMIN, MEMBER) if they are a member, or null if they aren't.
 */
export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });

  return membership?.role ?? null;
}