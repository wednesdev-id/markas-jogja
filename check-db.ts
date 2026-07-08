import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
)

async function check() {
  const { data, error } = await supabase.from('projects').select('*')
  if (error) {
    console.error("Supabase Error:", error.message)
  } else {
    console.log("Projects:", data)
  }
}

check()
