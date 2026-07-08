"use server";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(p: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: p.name,
      client: p.client,
      stripe: p.stripe,
      owner_id: user.id,
      data: { lists: [], threads: [], files: [], notes: [], logs: [], targets: {}, ads: { nonAds: false, entries: [] } }
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error creating project:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  return { id: data.id };
}
