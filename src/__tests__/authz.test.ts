jest.mock("server-only", () => ({}), { virtual: true });

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    project: {
      findUnique: jest.fn(),
    },
    list: {
      findUnique: jest.fn(),
    },
    todo: {
      findUnique: jest.fn(),
    },
  },
}));

import {
  assertListProjectAccess,
  assertProjectAccess,
  assertProjectEditor,
  assertProjectOwner,
  assertTodoProjectAccess,
  getProjectRole,
} from "@/lib/authz";
import { prisma } from "@/lib/prisma";

const projectFindUnique = prisma.project.findUnique as jest.Mock;
const listFindUnique = prisma.list.findUnique as jest.Mock;
const todoFindUnique = prisma.todo.findUnique as jest.Mock;

describe("authz helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns owner role for project owner", async () => {
    projectFindUnique.mockResolvedValue({ ownerId: "u1", members: [] });

    await expect(getProjectRole("u1", "p1")).resolves.toBe("owner");
    await expect(assertProjectOwner("u1", "p1")).resolves.toBe("owner");
  });

  it("allows editors to edit but not owner-only actions", async () => {
    projectFindUnique.mockResolvedValue({ ownerId: "owner", members: [{ role: "editor" }] });

    await expect(assertProjectAccess("u2", "p1")).resolves.toBe("editor");
    await expect(assertProjectEditor("u2", "p1")).resolves.toBe("editor");
    await expect(assertProjectOwner("u2", "p1")).rejects.toThrow("Unauthorized");
  });

  it("keeps viewers read-only", async () => {
    projectFindUnique.mockResolvedValue({ ownerId: "owner", members: [{ role: "viewer" }] });

    await expect(assertProjectAccess("u3", "p1")).resolves.toBe("viewer");
    await expect(assertProjectEditor("u3", "p1")).rejects.toThrow("Unauthorized");
  });

  it("rejects users without project access", async () => {
    projectFindUnique.mockResolvedValue({ ownerId: "owner", members: [] });

    await expect(getProjectRole("stranger", "p1")).resolves.toBeNull();
    await expect(assertProjectAccess("stranger", "p1")).rejects.toThrow("Unauthorized");
  });

  it("checks list and todo access through their project", async () => {
    listFindUnique.mockResolvedValue({ projectId: "p1" });
    todoFindUnique.mockResolvedValue({ list: { projectId: "p1" } });
    projectFindUnique.mockResolvedValue({ ownerId: "u1", members: [] });

    await expect(assertListProjectAccess("u1", "l1", "editor")).resolves.toEqual({ projectId: "p1", role: "owner" });
    await expect(assertTodoProjectAccess("u1", "t1", "editor")).resolves.toEqual({ projectId: "p1", role: "owner" });
  });
});
