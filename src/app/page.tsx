import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Home } from '@/components/Home'
import { createProject } from './actions'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const me = profile?.name || user.email?.split('@')[0] || 'User'

  // Ambil project yang memberOf = user.id
  const { data: pm } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('user_id', user.id)

  const memberOf = pm?.map((m) => m.project_id) || []

  let query = supabase.from('projects').select('id, slug, name, client, stripe, created_at, owner_id')
  if (memberOf.length > 0) {
    query = query.or(`owner_id.eq.${user.id},id.in.(${memberOf.join(',')})`)
  } else {
    query = query.eq('owner_id', user.id)
  }

  const { data: projects } = await query.order('created_at', { ascending: false })
  
  const parsedProjects = (projects || []).map(p => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    client: p.client || "",
    stripe: p.stripe || 0,
    createdAt: new Date(p.created_at).getTime(),
    lists: [], threads: [], files: [], notes: [], logs: [], targets: {}, ads: { nonAds: false, entries: [] }
  }));

  const { data: allMembers } = await supabase.from('project_members')
    .select('profiles(name)')
    .in('project_id', parsedProjects.map(p => p.id))
  
  const teamSet = new Set<string>();
  teamSet.add(me);
  allMembers?.forEach((m: any) => {
    if (m.profiles?.name) teamSet.add(m.profiles.name);
  });

  const markasData = { projects: parsedProjects, team: Array.from(teamSet), notes: [] };

  // Home uses "open" to navigate to project view
  // In the SPA it was `open(id) => setView(...)`
  // Now we need it to just navigate to `/project/[id]`
  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <HomeClientWrapper data={markasData} me={me} />
    </main>
  );
}

// Inline Client Component for wrappers
import { HomeClientWrapper } from './HomeClientWrapper'
