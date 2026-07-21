"use server";
import { auth } from "@/auth";
import { signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(p: any) {
  const session = await auth();
  const user = session?.user;
  if (!user) return { error: "Not logged in" };

  const baseSlug = (p.name || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`;

  try {
    await prisma.project.create({
      data: {
        name: p.name,
        slug: slug,
        client: p.client,
        stripe: p.stripe,
        ownerId: user.id as string,
        data: { lists: [], threads: [], files: [], notes: [], logs: [], targets: {}, ads: { nonAds: false, entries: [] } }
      }
    });
  } catch (error: any) {
    console.error("Error creating project:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { slug: slug };
}

export async function signoutAction() {
  await signOut({ redirect: false });
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function updateProfileAction(name: string) {
  const session = await auth();
  const user = session?.user;
  if (!user) return { error: "Not logged in" };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name }
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/');
  return { success: true };
}
