import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NotesClientWrapper } from './NotesClientWrapper'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('name, notes').eq('id', user.id).single()
  const me = profile?.name || user.email?.split('@')[0] || 'User'
  const initialNotes = typeof profile?.notes === 'string' ? JSON.parse(profile.notes) : (profile?.notes || [])

  const { data: pm } = await supabase.from('project_members').select('project_id').eq('user_id', user.id)
  const memberOf = pm?.map((m) => m.project_id) || []
  let query = supabase.from('projects').select('id')
  if (memberOf.length > 0) {
    query = query.or(`owner_id.eq.${user.id},id.in.(${memberOf.join(',')})`)
  } else {
    query = query.eq('owner_id', user.id)
  }
  const { data: projects } = await query
  
  const { data: allMembers } = await supabase.from('project_members')
    .select('profiles(name)')
    .in('project_id', (projects || []).map(p => p.id))
  
  const teamSet = new Set<string>();
  teamSet.add(me);
  allMembers?.forEach((m: any) => {
    if (m.profiles?.name) teamSet.add(m.profiles.name);
  });

  const data = { notes: initialNotes, team: Array.from(teamSet) as string[], projects: [] };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <NotesClientWrapper data={data as any} me={me} />
    </main>
  )
}
