import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { NotesClientWrapper } from './NotesClientWrapper'

export default async function NotesPage() {
  const session = await auth()
  const user = session?.user
  if (!user || !user.id) redirect('/login')

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, notes: true }
  })
  const me = profile?.name || user.email?.split('@')[0] || 'User'
  const initialNotes = typeof profile?.notes === 'string' ? JSON.parse(profile.notes as string) : (profile?.notes || [])

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
    select: { id: true }
  })
  
  const projectIds = projects.map(p => p.id)
  
  const allMembers = await prisma.projectMember.findMany({
    where: { projectId: { in: projectIds } },
    include: { user: { select: { name: true } } }
  })
  
  const teamSet = new Set<string>();
  teamSet.add(me);
  allMembers?.forEach((m: any) => {
    if (m.user?.name) teamSet.add(m.user.name);
  });

  const data = { notes: initialNotes, team: Array.from(teamSet) as string[], projects: [] };

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <NotesClientWrapper data={data as any} me={me} />
    </main>
  )
}
