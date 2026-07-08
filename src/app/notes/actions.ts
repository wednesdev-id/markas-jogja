"use server";
import { createClient } from "@/utils/supabase/server";

export async function updateNotesAction(notes: any[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not logged in" };

  const { error } = await supabase.from('profiles').update({ notes }).eq('id', user.id);
  if (error) {
    console.error("Error updating notes:", error);
    return { error: error.message };
  }
  return { success: true };
}
