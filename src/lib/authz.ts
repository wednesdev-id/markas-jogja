import "server-only";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type ProjectRole = "owner" | "admin" | "editor" | "viewer";
export type MemberRole = Exclude<ProjectRole, "owner">;

const roleRank: Record<ProjectRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
};

export class AuthzError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "AuthzError";
    this.status = status;
  }
}

export async function requireUser() {
  const session = await auth();
  const user = session?.user;

  if (!user?.id) {
    throw new AuthzError("Not logged in", 401);
  }

  return {
    id: user.id,
    email: user.email ?? null,
    name: user.name ?? null,
  };
}

export async function getProjectRole(userId: string, projectId: string): Promise<ProjectRole | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      ownerId: true,
      members: {
        where: { userId },
        select: { role: true },
        take: 1,
      },
    },
  });

  if (!project) return null;
  if (project.ownerId === userId) return "owner";

  const role = project.members[0]?.role;
  if (role === "admin" || role === "editor" || role === "viewer") {
    return role;
  }

  return null;
}

function assertRole(role: ProjectRole | null, minimum: ProjectRole, message = "Unauthorized") {
  if (!role || roleRank[role] < roleRank[minimum]) {
    throw new AuthzError(message);
  }

  return role;
}

export async function assertProjectAccess(userId: string, projectId: string) {
  return assertRole(await getProjectRole(userId, projectId), "viewer");
}

export async function assertProjectEditor(userId: string, projectId: string) {
  return assertRole(await getProjectRole(userId, projectId), "editor");
}

export async function assertProjectOwner(userId: string, projectId: string) {
  return assertRole(await getProjectRole(userId, projectId), "owner");
}

export async function assertListProjectAccess(userId: string, listId: string, minRole: ProjectRole = "viewer") {
  const list = await prisma.list.findUnique({
    where: { id: listId },
    select: { projectId: true },
  });

  if (!list) {
    throw new AuthzError("List not found", 404);
  }

  const role = assertRole(await getProjectRole(userId, list.projectId), minRole);
  return { projectId: list.projectId, role };
}

export async function assertTodoProjectAccess(userId: string, todoId: string, minRole: ProjectRole = "viewer") {
  const todo = await prisma.todo.findUnique({
    where: { id: todoId },
    select: {
      list: {
        select: { projectId: true },
      },
    },
  });

  if (!todo) {
    throw new AuthzError("Todo not found", 404);
  }

  const role = assertRole(await getProjectRole(userId, todo.list.projectId), minRole);
  return { projectId: todo.list.projectId, role };
}

export function actionError(error: unknown) {
  if (error instanceof AuthzError) {
    return { error: error.message };
  }

  const message = error instanceof Error ? error.message : "Unexpected error";
  return { error: message };
}
