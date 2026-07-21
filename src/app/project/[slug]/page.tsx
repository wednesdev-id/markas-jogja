import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { ProjectClientWrapper } from './ProjectClientWrapper'

export default async function ProjectDetailPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const session = await auth();
  const user = session?.user;
  if (!user || !user.id) redirect('/login');

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true }
  });
  
  const me = profile?.name || user.email?.split('@')[0] || 'User';

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.slug);
  
  let project = await prisma.project.findFirst({
    where: { slug: params.slug },
    include: {
      lists: {
        include: { todos: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!project && isUUID) {
    project = await prisma.project.findUnique({
      where: { id: params.slug },
      include: {
        lists: {
          include: { todos: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  }

  if (!project) return notFound();

  const userMemberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    select: { projectId: true }
  });
  
  const memberOf = userMemberships.map((m) => m.projectId) || [];
  const hasAccess = project.ownerId === user.id || memberOf.includes(project.id);
  if (!hasAccess) redirect('/');

  const pData = typeof project.data === 'string' ? JSON.parse(project.data as string) : (project.data || {});

  const lists = project.lists.map(l => ({
    id: l.id,
    name: l.name,
    todos: l.todos.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()).map(t => ({
      id: t.id,
      text: t.text,
      assignee: t.assignee || "",
      due: t.due ? new Date(t.due).toISOString() : "",
      done: !!t.done,
      priority: t.priority || ""
    }))
  }));

  const detailedProject = {
    id: project.id,
    name: project.name,
    client: project.client || "",
    stripe: project.stripe || 0,
    createdAt: new Date(project.createdAt).getTime(),
    lists: lists,
    threads: pData.threads || [],
    files: pData.files || [],
    notes: pData.notes || [],
    logs: pData.logs || [],
    targets: pData.targets || {},
    ads: pData.ads || { nonAds: false, entries: [] }
  };

  const teamProjects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { id: { in: memberOf } }
      ]
    },
    select: { id: true, ownerId: true }
  });
  
  const teamProjectIds = teamProjects.map(p => p.id);
  const teamProjectOwners = Array.from(new Set(teamProjects.map(p => p.ownerId).filter(Boolean)));
  
  const [allMembers, owners] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId: { in: teamProjectIds } },
      include: { user: { select: { name: true } } }
    }),
    prisma.user.findMany({
      where: { id: { in: teamProjectOwners } },
      select: { name: true }
    })
  ]);

  const teamSet = new Set<string>();
  teamSet.add(me);
  allMembers.forEach((m: any) => {
    if (m.user?.name) teamSet.add(m.user.name);
  });
  owners.forEach((o: any) => {
    if (o.name) teamSet.add(o.name);
  });

  const markasData = { projects: [], team: Array.from(teamSet), notes: [] };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <ProjectClientWrapper detailedProject={detailedProject} data={markasData as any} me={me} isOwner={project.ownerId === user.id} />
    </main>
  )
}
