"use server";
import { createClient } from "@/utils/supabase/server";

export async function updateProjectAction(id: string, patch: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: existingProject } = await supabase.from('projects').select('owner_id, data').eq('id', id).single();
  if (!existingProject) return { error: "Project not found" };

  const isOwner = existingProject.owner_id === user.id;
  const { name, client, stripe, createdAt, lists, ...dataPayload } = patch as any;
  
  let updatePayload: any = {};
  
  // Only owner can update name, client, stripe
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
    await supabase.from('projects').update(updatePayload).eq('id', id);
  }

  return { success: true };
}

export async function deleteProjectAction(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { data: existingProject } = await supabase.from('projects').select('owner_id').eq('id', id).single();
  if (!existingProject || existingProject.owner_id !== user.id) {
    return { error: "Unauthorized" };
  }

  await supabase.from('projects').delete().eq('id', id);
  return { success: true };
}
