import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { getWorkspaceMembership } from "@patchwatch/core";
import { AppError } from "@patchwatch/shared-types";
import { WorkspaceRole } from "@patchwatch/db";

const ROLE_RANKS: Record<WorkspaceRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

export async function requireWorkspaceMember(
  workspaceId: string,
  minRole?: WorkspaceRole
): Promise<WorkspaceRole> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new AppError(401, "Not signed in");
  }

  const role = await getWorkspaceMembership(session.user.id, workspaceId);
  
  if (!role) {
    throw new AppError(403, "Not a member of this workspace");
  }

  if (minRole) {
    if (ROLE_RANKS[role] < ROLE_RANKS[minRole]) {
      throw new AppError(403, "Insufficient role");
    }
  }

  return role;
}

export function withErrorHandling(handler: Function) {
  return async (...args: any[]) => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
          },
          { status: error.statusCode }
        );
      }
      
      console.error("[API Error]", error);
      return NextResponse.json(
        {
          success: false,
          message: "Internal server error",
        },
        { status: 500 }
      );
    }
  };
}