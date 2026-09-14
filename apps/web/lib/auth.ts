import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@patchwatch/db";
import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  events: {
    /**
     * createUser fires exactly once — only when the Prisma adapter inserts a
     * brand-new User row. Re-signing in as the same user never triggers this.
     * We provision a personal Workspace + OWNER membership atomically.
     */
    async createUser({ user }) {
      const workspaceName = user.name
        ? `${user.name}'s Workspace`
        : "My Workspace";

      await prisma.$transaction(async (tx) => {
        const workspace = await tx.workspace.create({
          data: { name: workspaceName },
        });

        await tx.workspaceMember.create({
          data: {
            workspaceId: workspace.id,
            userId: user.id,
            role: "OWNER",
          },
        });
      });
    },
  },
};