-- 1. Create Lists table for To-do lists
create table if not exists lists (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  name text not null,
  created_at timestamp with time zone default now()
);

-- 2. Create Todos table
create table if not exists todos (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references lists(id) on delete cascade not null,
  text text not null,
  assignee text,
  due date,
  done boolean default false,
  priority text check (priority in ('High', 'Medium', 'Low')),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table lists enable row level security;
alter table todos enable row level security;

-- Lists policies
create policy "Users can view lists in their projects" on lists for select using (
  public.has_project_access(project_id)
);
create policy "Users can modify lists in their projects" on lists for all using (
  public.has_project_access(project_id)
);

-- Todos policies
create policy "Users can view todos in their projects" on todos for select using (
  exists (select 1 from lists where id = list_id and public.has_project_access(project_id))
);
create policy "Users can modify todos in their projects" on todos for all using (
  exists (select 1 from lists where id = list_id and public.has_project_access(project_id))
);
