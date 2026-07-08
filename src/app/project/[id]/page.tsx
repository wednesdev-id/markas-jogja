import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProjectClientWrapper } from './ProjectClientWrapper'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('name').eq('id', user.id).single()
  const me = profile?.name || user.email?.split('@')[0] || 'User'

  // Fetch the project and its JSONB data
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!project) return notFound()

  // Parse project.data
  const pData = typeof project.data === 'string' ? JSON.parse(project.data) : (project.data || {})
  
  // Fetch lists and todos from relational DB
  const { data: dbLists } = await supabase.from('lists').select('*').eq('project_id', params.id).order('created_at', { ascending: true })
  
  const lists: any[] = [];
  if (dbLists && dbLists.length > 0) {
    const { data: dbTodos } = await supabase.from('todos').select('*').in('list_id', dbLists.map(l => l.id)).order('created_at', { ascending: true })
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
      lists.push({
        id: l.id,
        name: l.name,
        todos: todosByList[l.id] || []
      });
    });
  }

  const detailedProject = {
    id: project.id,
    name: project.name,
    client: project.client || "",
    stripe: project.stripe || 0,
    createdAt: new Date(project.created_at).getTime(),
    lists: lists, // From relational DB!
    threads: pData.threads || [],
    files: pData.files || [],
    notes: pData.notes || [],
    logs: pData.logs || [],
    targets: pData.targets || {},
    ads: pData.ads || { nonAds: false, entries: [] }
  }

  // Fetch team
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

  const markasData = { projects: [], team: Array.from(teamSet), notes: [] }

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <ProjectClientWrapper detailedProject={detailedProject} data={markasData} me={me} />
    </main>
  )
}
