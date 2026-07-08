import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { KalenderClientWrapper } from './KalenderClientWrapper'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch lists and todos accessible to this user
  // Because of RLS, we only get ones for projects the user has access to
  const { data: todosData } = await supabase
    .from('todos')
    .select('*, lists(name, projects(id, name, stripe))')
    .not('due', 'is', null)

  const tasks = (todosData || []).map((t: any) => ({
    id: t.id,
    text: t.text,
    assignee: t.assignee || "",
    due: t.due || "",
    done: t.done || false,
    priority: t.priority || "",
    projectId: t.lists?.projects?.id || "",
    projectName: t.lists?.projects?.name || "",
    stripe: t.lists?.projects?.stripe || 0,
    listName: t.lists?.name || ""
  }))

  return (
    <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
      <KalenderClientWrapper tasks={tasks} />
    </main>
  )
}
