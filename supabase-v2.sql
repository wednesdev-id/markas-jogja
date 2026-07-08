-- 1. Create Profiles table (linked to auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  name text,
  notes jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now()
);

-- 2. Create Projects table (stores main config and JSON data)
create table projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  client text default '',
  stripe int default 0,
  data jsonb default '{}'::jsonb,
  owner_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 3. Create Project Members table (for invitations/sharing)
create table project_members (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  role text check (role in ('viewer', 'editor', 'admin')) default 'viewer',
  created_at timestamp with time zone default now(),
  unique (project_id, user_id)
);

-- 4. Create Invitations table (for sharing links)
create table invitations (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  token text unique not null,
  role text check (role in ('viewer', 'editor')) default 'viewer',
  created_at timestamp with time zone default now()
);

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table invitations enable row level security;

-- Helper function to prevent RLS infinite recursion
create or replace function public.has_project_access(_project_id uuid)
returns boolean
language sql security definer set search_path = public
as $$
  select exists (
    select 1 from projects where id = _project_id and owner_id = auth.uid()
  ) or exists (
    select 1 from project_members where project_id = _project_id and user_id = auth.uid()
  );
$$;

-- Profiles Policies
create policy "Users can view their own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can view profiles of members in same project" on profiles for select using (
  id = auth.uid() or
  exists (
    select 1 from project_members pm
    where pm.user_id = profiles.id and pm.project_id in (
      select id from projects where owner_id = auth.uid()
      union
      select project_id from project_members where user_id = auth.uid()
    )
  )
);

-- Projects Policies
create policy "Users can view projects they own or are members of" on projects for select using (
  public.has_project_access(id)
);
create policy "Users can insert projects" on projects for insert with check (owner_id = auth.uid());
create policy "Users can update projects they own or are editors of" on projects for update using (
  owner_id = auth.uid() or
  exists (select 1 from project_members where project_id = id and user_id = auth.uid() and role in ('editor', 'admin'))
);
create policy "Users can delete their own projects" on projects for delete using (owner_id = auth.uid());

-- Project Members Policies
create policy "Users can view members of their projects" on project_members for select using (
  public.has_project_access(project_id)
);
create policy "Project owners can manage members" on project_members for all using (
  exists (select 1 from projects where id = project_id and owner_id = auth.uid())
);
create policy "Users can join projects via invite" on project_members for insert with check (
  auth.uid() = user_id -- They can only add themselves
);

-- Invitations Policies
create policy "Users can view invitations for their projects" on invitations for select using (
  exists (select 1 from projects where id = invitations.project_id and owner_id = auth.uid())
);
create policy "Project owners can create invitations" on invitations for insert with check (
  exists (select 1 from projects where id = project_id and owner_id = auth.uid())
);
create policy "Project owners can delete invitations" on invitations for delete using (
  exists (select 1 from projects where id = project_id and owner_id = auth.uid())
);
-- Anyone authenticated can view an invitation by token
create policy "Anyone authenticated can view invitation details" on invitations for select using (auth.uid() is not null);


-- Trigger to handle new user creation automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Performance Indexes
create index if not exists idx_projects_owner on projects(owner_id);
create index if not exists idx_project_members_user on project_members(user_id);
create index if not exists idx_project_members_project on project_members(project_id);
