import { test, describe, beforeEach, mock } from "node:test";
import assert from "node:assert";
import { AppError } from "@patchwatch/shared-types";

// 1. Setup mocks BEFORE importing the module under test
const getServerSessionMock = mock.fn();
mock.module("next-auth", {
  namedExports: {
    getServerSession: getServerSessionMock,
  },
});

const getWorkspaceMembershipMock = mock.fn();
mock.module("@patchwatch/core", {
  namedExports: {
    getWorkspaceMembership: getWorkspaceMembershipMock,
  },
});

mock.module("./auth", {
  namedExports: {
    authOptions: {},
  },
});

// 2. Import the module under test dynamically so mocks apply
const { requireWorkspaceMember } = await import("./api-helpers");

describe("requireWorkspaceMember", () => {
  beforeEach(() => {
    getServerSessionMock.mock.resetCalls();
    getWorkspaceMembershipMock.mock.resetCalls();
  });

  test("throws 401 when signed out", async () => {
    getServerSessionMock.mock.mockImplementation(async () => null);

    try {
      await requireWorkspaceMember("ws-1");
      assert.fail("Should have thrown");
    } catch (error: any) {
      assert.ok(error instanceof AppError);
      assert.strictEqual(error.statusCode, 401);
      assert.strictEqual(error.message, "Not signed in");
    }
  });

  test("throws 403 when user is not a member of the workspace", async () => {
    getServerSessionMock.mock.mockImplementation(async () => ({
      user: { id: "user-1", name: "Test User" },
      expires: "9999",
    }));
    getWorkspaceMembershipMock.mock.mockImplementation(async () => null);

    try {
      await requireWorkspaceMember("ws-1");
      assert.fail("Should have thrown");
    } catch (error: any) {
      assert.ok(error instanceof AppError);
      assert.strictEqual(error.statusCode, 403);
      assert.strictEqual(error.message, "Not a member of this workspace");
    }
  });

  test("succeeds and returns 'OWNER' when user is the owner", async () => {
    getServerSessionMock.mock.mockImplementation(async () => ({
      user: { id: "user-1", name: "Test User" },
      expires: "9999",
    }));
    getWorkspaceMembershipMock.mock.mockImplementation(async () => "OWNER");

    const role = await requireWorkspaceMember("ws-1");
    assert.strictEqual(role, "OWNER");
  });
});