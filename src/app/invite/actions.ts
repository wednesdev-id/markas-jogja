"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publishProjectEvent } from "@/lib/project-events";

export async function acceptInvite(token: string) {
  const session = await auth();
  const user = session?.user;
  
  if (!user || !user.id) {
    return { error: "Anda harus login terlebih dahulu.", redirect: "/login" };
  }

  const invite = await prisma.invitation.findUnique({ where: { token } });
  
  if (!invite) {
    return { error: "Tautan undangan tidak valid atau sudah kadaluarsa." };
  }

  try {
    await prisma.projectMember.upsert({
      where: {
        projectId_userId: {
          projectId: invite.projectId,
          userId: user.id
        }
      },
      create: {
        projectId: invite.projectId,
        userId: user.id,
        role: invite.role
      },
      update: {
        role: invite.role
      }
    });
    publishProjectEvent({ type: "member", projectId: invite.projectId });
    return { success: true };
  } catch (error: any) {
    return { error: 'Gagal bergabung ke proyek: ' + error.message };
  }
}
