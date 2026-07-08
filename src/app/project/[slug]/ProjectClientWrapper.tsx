"use client";
import { useState, useEffect } from "react";
import { ProjectPage } from "@/components/ProjectPage";
import { MarkasData, Project } from "@/types";
import { updateProjectAction } from "./actions";
import { createClient } from "@/utils/supabase/client";

export function ProjectClientWrapper({ detailedProject, data, me, isOwner }: { detailedProject: Project, data: MarkasData, me: string, isOwner: boolean }) {
  const [project, setProject] = useState<Project>(detailedProject);
  const [view, setView] = useState({ page: "project", id: project.id, tab: "todo" });

  useEffect(() => {
    const supabase = createClient();

    // Auto-upgrade any 'viewer' members to 'editor' so they can comment & update discussions
    // Only the owner has permission to do this based on RLS
    if (isOwner) {
      supabase.from('project_members').update({ role: 'editor' }).eq('project_id', project.id).eq('role', 'viewer').then();
    }

    const channel = supabase
      .channel(`project-${project.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'projects', filter: `id=eq.${project.id}` },
        (payload) => {
          if (payload.new) {
            setProject((prev) => {
              const newData = typeof payload.new.data === 'string' ? JSON.parse(payload.new.data) : (payload.new.data || {});
              return {
                ...prev,
                ...newData,
                lists: prev.lists, // Preserve relational lists
                name: payload.new.name || prev.name,
                client: payload.new.client || prev.client,
                stripe: payload.new.stripe !== undefined ? payload.new.stripe : prev.stripe
              };
            });
          }
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lists', filter: `project_id=eq.${project.id}` }, (payload) => {
        setProject((prev) => {
          if (payload.eventType === 'INSERT') {
            if (prev.lists.find(l => l.id === payload.new.id)) return prev;
            return { ...prev, lists: [...prev.lists, { id: payload.new.id, name: payload.new.name, todos: [] }] };
          } else if (payload.eventType === 'UPDATE') {
            const list = prev.lists.find(l => l.id === payload.new.id);
            if (!list || list.name === payload.new.name) return prev;
            return { ...prev, lists: prev.lists.map(l => l.id === payload.new.id ? { ...l, name: payload.new.name } : l) };
          } else if (payload.eventType === 'DELETE') {
            if (!prev.lists.find(l => l.id === payload.old.id)) return prev;
            return { ...prev, lists: prev.lists.filter(l => l.id !== payload.old.id) };
          }
          return prev;
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
        setProject((prev) => {
          if (payload.eventType === 'INSERT') {
            const list = prev.lists.find(l => l.id === payload.new.list_id);
            if (!list || list.todos.find((t: any) => t.id === payload.new.id)) return prev;
            return {
              ...prev,
              lists: prev.lists.map(l => l.id === payload.new.list_id ? { ...l, todos: [...l.todos, payload.new as any] } : l)
            };
          } else if (payload.eventType === 'UPDATE') {
            const list = prev.lists.find(l => l.id === payload.new.list_id);
            if (!list) return prev;
            const existing: any = list.todos.find((t: any) => t.id === payload.new.id);
            if (existing && 
                existing.text === payload.new.text && 
                existing.done === payload.new.done && 
                existing.due === payload.new.due && 
                existing.assignee === payload.new.assignee && 
                existing.priority === payload.new.priority) {
              return prev; // No actual change (prevents re-render & focus loss)
            }
            return {
              ...prev,
              lists: prev.lists.map(l => l.id === payload.new.list_id ? {
                ...l,
                todos: l.todos.map((t: any) => t.id === payload.new.id ? (payload.new as any) : t)
              } : l)
            };
          } else if (payload.eventType === 'DELETE') {
            const listToUpdate = prev.lists.find(l => l.todos.find((t: any) => t.id === payload.old.id));
            if (!listToUpdate) return prev;
            return {
              ...prev,
              lists: prev.lists.map(l => l.id === listToUpdate.id ? { ...l, todos: l.todos.filter((t: any) => t.id !== payload.old.id) } : l)
            };
          }
          return prev;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  const handleUpdate = async (id: string, patch: Partial<Project> | ((prev: Project) => Partial<Project>)) => {
    setProject((prev) => {
      const p = typeof patch === "function" ? patch(prev) : patch;
      const { lists, ...dbPatch } = p as any; // Strip relational lists before saving to data JSON
      updateProjectAction(id, dbPatch);
      return { ...prev, ...p };
    });
  };

  const handleSetView = (newView: any) => {
    if (newView.page === "home") {
      window.location.href = "/";
    } else {
      setView(newView);
    }
  };

  return <ProjectPage project={project} data={data} updateProject={handleUpdate} me={me} view={view} setView={handleSetView} isOwner={isOwner} />;
}
