"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { actionError, assertProjectOwner, getProjectRole, requireUser } from "@/lib/authz";
import { publishProjectEvent } from "@/lib/project-events";

export async function updateProjectAction(id: string, patch: any) {
  try {
    const user = await requireUser();
    const role = await getProjectRole(user.id, id);
    const canEditData = role === "owner" || role === "admin" || role === "editor";
    const isOwner = role === "owner";

    if (!canEditData) return { error: "Unauthorized" };

    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { data: true }
    });

    if (!existingProject) return { error: "Project not found" };

    const { name, client, stripe, createdAt, lists, id: _id, slug, ...dataPayload } = patch as any;
    let updatePayload: any = {};

    if (isOwner) {
      if (name !== undefined) updatePayload.name = name;
      if (client !== undefined) updatePayload.client = client;
      if (stripe !== undefined) updatePayload.stripe = stripe;
    }

    if (Object.keys(dataPayload).length > 0) {
      const existingData = typeof existingProject.data === 'string' ? JSON.parse(existingProject.data) : (existingProject.data || {});
      updatePayload.data = { ...existingData, ...dataPayload };
    }

    if (Object.keys(updatePayload).length > 0) {
      await prisma.project.update({
        where: { id },
        data: updatePayload
      });
      publishProjectEvent({ type: "project", projectId: id });
    }

    revalidatePath(`/project/${id}`);
    revalidatePath('/calendar');
    return { success: true };
  } catch (error) {
    return actionError(error);
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const user = await requireUser();
    await assertProjectOwner(user.id, id);
    await prisma.project.delete({ where: { id } });
    publishProjectEvent({ type: "project", projectId: id });
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return actionError(error);
  }
  return { success: true };
}
