import { createClient } from "@/utils/supabase/server";
import { Header } from "@/components/Header";

export async function HeaderWrapper() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return null;
  
  let me = "User";
  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single();
  me = profile?.name || user.email?.split('@')[0] || "User";

  return <Header me={me} />;
}
