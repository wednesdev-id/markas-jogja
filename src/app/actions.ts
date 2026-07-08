"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(p: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const baseSlug = (p.name || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  const slug = `${baseSlug}-${randomSuffix}`;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: p.name,
      slug: slug,
      client: p.client,
      stripe: p.stripe,
      owner_id: user.id,
      data: { lists: [], threads: [], files: [], notes: [], logs: [], targets: {}, ads: { nonAds: false, entries: [] } }
    })
    .select("id, slug")
    .single();

  if (error) {
    console.error("Error creating project:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { id: data.id, slug: data.slug };
}

export async function signoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/');
}

export async function updateProfileAction(name: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase
    .from('profiles')
    .update({ name })
    .eq('id', user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { error: error.message };
  }

  revalidatePath('/profile');
  revalidatePath('/');
  return { success: true };
}
