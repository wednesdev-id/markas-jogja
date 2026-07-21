import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { DashboardClientWrapper } from './DashboardClientWrapper'

export default async function DashboardPage() {
  const session = await auth()
  const user = session?.user
  if (!user || !user.id) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true }
  })
  const me = profile?.name || user.email?.split('@')[0] || 'User'

  const userMemberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    select: { projectId: true }
  })
  const memberOf = userMemberships.map((m) => m.projectId) || []

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
    const pData = typeof p.data === 'string' ? JSON.parse(p.data as string) : (p.data || {});
    return {
      id: p.id,
      name: p.name,
      client: p.client || "",
      stripe: p.stripe || 0,
      createdAt: new Date(p.createdAt).getTime(),
      lists: p.lists.map(l => ({
        id: l.id,
        name: l.name,
        todos: l.todos.map(t => ({
          id: t.id,
          text: t.text,
          assignee: t.assignee || "",
          due: t.due ? new Date(t.due).toISOString() : "",
          done: !!t.done,
          priority: t.priority || ""
        }))
      })),
      threads: pData.threads || [],
      files: pData.files || [],
      notes: pData.notes || [],
      logs: pData.logs || [],
      targets: pData.targets || {},
      ads: pData.ads || { nonAds: false, entries: [] }
    }
  });

  const projectIds = parsedProjects.map(p => p.id);
  
  const allMembers = await prisma.projectMember.findMany({
    where: { projectId: { in: projectIds } },
    include: { user: { select: { name: true } } }
  });
  
  const teamSet = new Set<string>();
  teamSet.add(me);
  allMembers?.forEach((m: any) => {
    if (m.user?.name) teamSet.add(m.user.name);
  });

  const markasData = { projects: parsedProjects, team: Array.from(teamSet), notes: [] };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <DashboardClientWrapper data={markasData} me={me} />
    </main>
  )
}
