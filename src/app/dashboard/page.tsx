import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClientWrapper } from './DashboardClientWrapper'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const me = profile?.name || user.email?.split('@')[0] || 'User'

  const { data: pm } = await supabase.from('project_members').select('project_id').eq('user_id', user.id)
  const memberOf = pm?.map((m) => m.project_id) || []
  let query = supabase.from('projects').select('id, name, client, stripe, created_at, owner_id, data')
  if (memberOf.length > 0) {
    query = query.or(`owner_id.eq.${user.id},id.in.(${memberOf.join(',')})`)
  } else {
    query = query.eq('owner_id', user.id)
  }
  const { data: projects } = await query.order('created_at', { ascending: false })
  
  const { data: dbLists } = await supabase.from('lists').select('*').in('project_id', (projects||[]).map(p => p.id))
  
  const listsByProject: any = {};
  if (dbLists && dbLists.length > 0) {
    const { data: dbTodos } = await supabase.from('todos').select('*').in('list_id', dbLists.map(l => l.id))
    const todosByList = (dbTodos || []).reduce((acc: any, t: any) => {
      if (!acc[t.list_id]) acc[t.list_id] = [];
      acc[t.list_id].push({
        id: t.id,
        text: t.text,
        assignee: t.assignee || "",
        due: t.due || "",
        done: t.done || false,
        priority: t.priority || ""
      });
      return acc;
    }, {});

    dbLists.forEach(l => {
      if (!listsByProject[l.project_id]) listsByProject[l.project_id] = [];
      listsByProject[l.project_id].push({
        id: l.id,
        name: l.name,
        todos: todosByList[l.id] || []
      });
    });
  }

  const parsedProjects = (projects || []).map(p => {
    const pData = typeof p.data === 'string' ? JSON.parse(p.data) : (p.data || {});
    return {
      id: p.id,
      name: p.name,
      client: p.client || "",
      stripe: p.stripe || 0,
      createdAt: new Date(p.created_at).getTime(),
      lists: listsByProject[p.id] || [],
      threads: pData.threads || [],
      files: pData.files || [],
      notes: pData.notes || [],
      logs: pData.logs || [],
      targets: pData.targets || {},
      ads: pData.ads || { nonAds: false, entries: [] }
    }
  });

  const { data: allMembers } = await supabase.from('project_members')
    .select('profiles(name)')
    .in('project_id', parsedProjects.map(p => p.id))
  
  const teamSet = new Set<string>();
  teamSet.add(me);
  allMembers?.forEach((m: any) => {
    if (m.profiles?.name) teamSet.add(m.profiles.name);
  });

  const markasData = { projects: parsedProjects, team: Array.from(teamSet), notes: [] };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <DashboardClientWrapper data={markasData} me={me} />
    </main>
  )
}
