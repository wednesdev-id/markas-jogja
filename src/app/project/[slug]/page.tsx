import { createClient } from '@/utils/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProjectClientWrapper } from './ProjectClientWrapper'

export default async function ProjectDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, projectSlugRes, pmRes] = await Promise.all([
    supabase.from('profiles').select('name').eq('id', user.id).single(),
    supabase.from('projects').select('*').eq('slug', params.slug).single(),
    supabase.from('project_members').select('project_id').eq('user_id', user.id)
  ]);

  const profile = profileRes.data;
  const me = profile?.name || user.email?.split('@')[0] || 'User';

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.slug);
  let project = projectSlugRes.data;
  
  if (!project && isUUID) {
    const fallbackQuery = await supabase.from('projects').select('*').eq('id', params.slug).single();
    project = fallbackQuery.data;
  }

  if (!project) return notFound();

  const memberOf = pmRes.data?.map((m) => m.project_id) || [];
  const hasAccess = project.owner_id === user.id || memberOf.includes(project.id);
  if (!hasAccess) redirect('/');

  const pData = typeof project.data === 'string' ? JSON.parse(project.data) : (project.data || {});

  let teamQuery = supabase.from('projects').select('id, owner_id');
  if (memberOf.length > 0) {
    teamQuery = teamQuery.or(`owner_id.eq.${user.id},id.in.(${memberOf.join(',')})`);
  } else {
    teamQuery = teamQuery.eq('owner_id', user.id);
  }

  const [dbListsRes, projectsRes] = await Promise.all([
    supabase.from('lists').select('*').eq('project_id', project.id).order('created_at', { ascending: true }),
    teamQuery
  ]);

  const dbLists = dbListsRes.data;
  const teamProjects = projectsRes.data;

  const listsToQuery = dbLists && dbLists.length > 0 ? dbLists.map(l => l.id) : [];
  const teamProjectIds = teamProjects ? teamProjects.map(p => p.id) : [];
  const teamProjectOwners = teamProjects ? Array.from(new Set(teamProjects.map(p => p.owner_id).filter(Boolean))) : [];

  const [dbTodosRes, allMembersRes, ownersRes] = await Promise.all([
    listsToQuery.length > 0 ? supabase.from('todos').select('*').in('list_id', listsToQuery).order('created_at', { ascending: true }) : Promise.resolve({ data: [] }),
    teamProjectIds.length > 0 ? supabase.from('project_members').select('profiles(name)').in('project_id', teamProjectIds) : Promise.resolve({ data: [] }),
    teamProjectOwners.length > 0 ? supabase.from('profiles').select('name').in('id', teamProjectOwners) : Promise.resolve({ data: [] })
  ]);

  const dbTodos = dbTodosRes.data || [];
  const allMembers = allMembersRes.data || [];
  const owners = ownersRes.data || [];

  const lists: any[] = [];
  if (dbLists && dbLists.length > 0) {
    const todosByList = dbTodos.reduce((acc: any, t: any) => {
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
    lists: lists,
    threads: pData.threads || [],
    files: pData.files || [],
    notes: pData.notes || [],
    logs: pData.logs || [],
    targets: pData.targets || {},
    ads: pData.ads || { nonAds: false, entries: [] }
  };

  const teamSet = new Set<string>();
  teamSet.add(me);
  allMembers.forEach((m: any) => {
    if (m.profiles?.name) teamSet.add(m.profiles.name);
  });
  owners.forEach((o: any) => {
    if (o.name) teamSet.add(o.name);
  });

  const markasData = { projects: [], team: Array.from(teamSet), notes: [] };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <ProjectClientWrapper detailedProject={detailedProject} data={markasData} me={me} isOwner={project.owner_id === user.id} />
    </main>
  )
}
