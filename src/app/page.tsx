import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { Home } from '@/components/Home'
import { createProject } from './actions'
import { HomeClientWrapper } from './HomeClientWrapper'

export default async function HomePage() {
  const session = await auth()
  const user = session?.user
  if (!user || !user.id) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true }
  })

  const me = profile?.name || user.email?.split('@')[0] || 'User';

  const userMemberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    select: { projectId: true }
  })
  
  const memberOf = userMemberships.map((m) => m.projectId) || [];

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { id: { in: memberOf } }
      ]
    },
    include: {
      lists: {
        include: {
          todos: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
  
  const parsedProjects = (projects || []).map(p => {
    const d = typeof p.data === 'string' ? JSON.parse(p.data as string) : (p.data || {});
    const fetchedLists = p.lists || [];
    return {
      id: p.id,
      slug: p.slug || undefined,
      name: p.name,
      client: p.client || "",
      stripe: p.stripe || 0,
      createdAt: new Date(p.createdAt).getTime(),
      owner_id: p.ownerId,
      lists: fetchedLists.map((l: any) => ({
        ...l,
        todos: l.todos.map((t: any) => ({
          ...t,
          assignee: t.assignee || "",
          due: t.due ? new Date(t.due).toISOString() : "",
          done: !!t.done,
          priority: t.priority || ""
        }))
      })), threads: d.threads || [], files: d.files || [], notes: d.notes || [], logs: d.logs || [], targets: d.targets || {}, ads: d.ads || { nonAds: false, entries: [] }
    };
  });

  const projectIds = parsedProjects.map(p => p.id);
  const ownerIds = Array.from(new Set(parsedProjects.map(p => p.owner_id).filter(Boolean)));
  
  const [allMembers, owners] = await Promise.all([
    prisma.projectMember.findMany({
      where: { projectId: { in: projectIds } },
      include: { user: { select: { name: true } } }
    }),
    prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { name: true }
    })
  ]);

  const teamSet = new Set<string>();
  teamSet.add(me);
  allMembers?.forEach((m: any) => {
    if (m.user?.name) teamSet.add(m.user.name);
  });
  owners?.forEach((o: any) => {
    if (o.name) teamSet.add(o.name);
  });

  const markasData = { projects: parsedProjects, team: Array.from(teamSet), notes: [] };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <HomeClientWrapper data={markasData} me={me} />
    </main>
  );
}
