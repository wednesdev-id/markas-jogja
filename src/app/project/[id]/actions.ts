"use server";
import { createClient } from "@/utils/supabase/server";

export async function updateProjectAction(id: string, patch: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { name, client, stripe, createdAt, lists, ...dataPayload } = patch as any;
  
  let updatePayload: any = {};
  if (name !== undefined) updatePayload.name = name;
  if (client !== undefined) updatePayload.client = client;
  if (stripe !== undefined) updatePayload.stripe = stripe;
  
  // Lists are now managed separately via Todos.tsx using direct DB updates
  // But wait, Todos.tsx calls update({ lists: ... })
  // If patch contains lists, we SHOULD NOT save them to JSONB. 
  // Wait, if Todos.tsx calls this to save lists, we need a separate server action or handle it here!
  
  // We'll let `Todos.tsx` handle its own DB calls to avoid conflicts.
  
  if (Object.keys(dataPayload).length > 0) {
    const { data: existing } = await supabase.from('projects').select('data').eq('id', id).single();
    if (existing) {
      const existingData = typeof existing.data === 'string' ? JSON.parse(existing.data) : (existing.data || {});
      updatePayload.data = { ...existingData, ...dataPayload };
    }
  }
  
  if (Object.keys(updatePayload).length > 0) {
    await supabase.from('projects').update(updatePayload).eq('id', id);
  }

  return { success: true };
}
