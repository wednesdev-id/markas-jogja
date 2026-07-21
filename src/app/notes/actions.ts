"use server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function updateNotesAction(notes: any[]) {
  const session = await auth();
  const user = session?.user;
  if (!user) return { error: "Not logged in" };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { notes }
    });
  } catch (error: any) {
    console.error("Error updating notes:", error);
    return { error: error.message };
  }
  return { success: true };
}
