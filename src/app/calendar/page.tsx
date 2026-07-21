import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { KalenderClientWrapper } from './KalenderClientWrapper'

export default async function CalendarPage() {
  const session = await auth()
  const user = session?.user
  if (!user || !user.id) redirect('/login')

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

  const todosData = await prisma.todo.findMany({
    where: {
      due: { not: null },
      list: {
        projectId: { in: projectIds }
      }
    },
    include: {
      list: {
        include: {
          project: { select: { id: true, name: true, stripe: true, slug: true } }
        }
      }
    }
  })

  const tasks = todosData.map((t) => ({
    id: t.id,
    text: t.text,
    assignee: t.assignee || "",
    due: t.due ? new Date(t.due).toISOString() : "",
    done: !!t.done,
    priority: t.priority || "",
    projectId: t.list.project.id,
    projectName: t.list.project.name,
    projectSlug: t.list.project.slug || "",
    stripe: t.list.project.stripe || 0,
    listName: t.list.name
  }))

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <KalenderClientWrapper tasks={tasks} />
    </main>
  )
}
