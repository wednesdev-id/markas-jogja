-- Enable RLS on projects table if not already enabled
alter table projects enable row level security;

-- Drop existing INSERT policy if it exists to avoid conflicts
drop policy if exists "Users can insert projects" on projects;

-- Create the correct INSERT policy
create policy "Users can insert projects" on projects for insert with check (owner_id = auth.uid());

-- Just in case, verify the SELECT policy too
drop policy if exists "Users can view projects they own or are members of" on projects;
create policy "Users can view projects they own or are members of" on projects for select using (
  public.has_project_access(id)
);
