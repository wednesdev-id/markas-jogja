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
                name: payload.new.name || prev.name,
                client: payload.new.client || prev.client,
                stripe: payload.new.stripe !== undefined ? payload.new.stripe : prev.stripe
              };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [project.id]);

  const handleUpdate = async (id: string, patch: Partial<Project> | ((prev: Project) => Partial<Project>)) => {
    setProject((prev) => {
      const p = typeof patch === "function" ? patch(prev) : patch;
      updateProjectAction(id, p);
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
