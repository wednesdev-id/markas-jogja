"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Project } from "@/types";
import {
  actionError,
  assertListProjectAccess,
  assertProjectAccess,
  assertProjectEditor,
  assertProjectOwner,
  assertTodoProjectAccess,
  requireUser,
} from "@/lib/authz";
import { publishProjectEvent } from "@/lib/project-events";

function normalizeTodoPatch(data: any) {
  const patch: Record<string, unknown> = {};

  if (typeof data?.text === "string") patch.text = data.text;
  if ("assignee" in (data ?? {})) patch.assignee = data.assignee || null;
  if ("due" in (data ?? {})) patch.due = data.due ? new Date(data.due) : null;
  if ("priority" in (data ?? {})) patch.priority = data.priority || null;
  if (typeof data?.done === "boolean") patch.done = data.done;

  return patch;
}

export async function addListAction(projectId: string, name: string) {
  try {
    const user = await requireUser();
    await assertProjectEditor(user.id, projectId);

    const list = await prisma.list.create({
      data: { projectId, name }
    });
    publishProjectEvent({ type: "list", projectId });
    revalidatePath(`/project/${projectId}`);
    return { id: list.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeListAction(listId: string) {
  try {
    const user = await requireUser();
    const { projectId } = await assertListProjectAccess(user.id, listId, "editor");

    await prisma.list.delete({ where: { id: listId } });
    publishProjectEvent({ type: "list", projectId });
    revalidatePath(`/project/${projectId}`);
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function addTodoAction(data: any) {
  try {
    const user = await requireUser();
    const { projectId } = await assertListProjectAccess(user.id, data.list_id, "editor");

    const todo = await prisma.todo.create({
      data: {
        listId: data.list_id,
        text: data.text,
        assignee: data.assignee || null,
        due: data.due ? new Date(data.due) : null,
        priority: data.priority || null,
        done: false
      }
    });
    publishProjectEvent({ type: "todo", projectId });
    revalidatePath(`/project/${projectId}`);
    return { id: todo.id };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateTodoAction(todoId: string, data: any) {
  try {
    const user = await requireUser();
    const { projectId } = await assertTodoProjectAccess(user.id, todoId, "editor");
    const patch = normalizeTodoPatch(data);

    if (Object.keys(patch).length > 0) {
      await prisma.todo.update({
        where: { id: todoId },
        data: patch
      });
      publishProjectEvent({ type: "todo", projectId });
      revalidatePath(`/project/${projectId}`);
    }
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeTodoAction(todoId: string) {
  try {
    const user = await requireUser();
    const { projectId } = await assertTodoProjectAccess(user.id, todoId, "editor");

    await prisma.todo.delete({ where: { id: todoId } });
    publishProjectEvent({ type: "todo", projectId });
    revalidatePath(`/project/${projectId}`);
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function getProjectMembersAction(projectId: string) {
  try {
    const user = await requireUser();
    await assertProjectAccess(user.id, projectId);

    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, name: true } } }
    });

    return members.map(m => ({
      userId: m.user.id,
      role: m.role,
      profiles: { name: m.user?.name || "Unknown" }
    }));
  } catch {
    return [];
  }
}

export async function createInviteAction(projectId: string, role: string, token: string) {
  try {
    const user = await requireUser();
    await assertProjectOwner(user.id, projectId);

    await prisma.invitation.create({
      data: { projectId, role: role === "viewer" ? "viewer" : "editor", token }
    });
    publishProjectEvent({ type: "member", projectId });
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function removeMemberAction(projectId: string, userId: string) {
  try {
    const user = await requireUser();
    await assertProjectOwner(user.id, projectId);

    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId }
      }
    });
    publishProjectEvent({ type: "member", projectId });
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function upgradeViewersAction(projectId: string) {
  try {
    const user = await requireUser();
    await assertProjectOwner(user.id, projectId);

    await prisma.projectMember.updateMany({
      where: { projectId, role: 'viewer' },
      data: { role: 'editor' }
    });
    publishProjectEvent({ type: "member", projectId });
  } catch {
    return;
  }
}

export async function getProjectSnapshotAction(projectId: string): Promise<Project | { error: string }> {
  try {
    const user = await requireUser();
    await assertProjectAccess(user.id, projectId);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        lists: {
          include: { todos: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!project) return { error: "Project not found" };

    const projectData = typeof project.data === "string" ? JSON.parse(project.data) : (project.data || {});

    return {
      id: project.id,
      slug: project.slug || undefined,
      name: project.name,
      client: project.client || "",
      stripe: project.stripe || 0,
      createdAt: project.createdAt.getTime(),
      lists: project.lists.map((list) => ({
        id: list.id,
        name: list.name,
        todos: list.todos
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
          .map((todo) => ({
            id: todo.id,
            text: todo.text,
            assignee: todo.assignee || "",
            due: todo.due ? todo.due.toISOString() : "",
            done: !!todo.done,
            priority: todo.priority || "",
          })),
      })),
      threads: projectData.threads || [],
      files: projectData.files || [],
      notes: projectData.notes || [],
      logs: projectData.logs || [],
      targets: projectData.targets || {},
      ads: projectData.ads || { nonAds: false, entries: [] },
    };
  } catch (error) {
    return actionError(error);
  }
}
