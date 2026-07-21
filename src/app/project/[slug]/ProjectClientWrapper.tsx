"use client";
import { useState, useEffect } from "react";
import { ProjectPage } from "@/components/ProjectPage";
import { MarkasData, Project } from "@/types";
import { updateProjectAction } from "./actions";
import { getProjectSnapshotAction, upgradeViewersAction } from "./clientActions";

export function ProjectClientWrapper({ detailedProject, data, me, isOwner }: { detailedProject: Project, data: MarkasData, me: string, isOwner: boolean }) {
  const [project, setProject] = useState<Project>(detailedProject);
  const [view, setView] = useState({ page: "project", id: project.id, tab: "todo" });

  useEffect(() => {
    // Auto-upgrade any 'viewer' members to 'editor' so they can comment & update discussions
    if (isOwner) {
      upgradeViewersAction(project.id).then();
    }
  }, [project.id, isOwner]);

  useEffect(() => {
    const events = new EventSource(`/api/projects/${project.id}/events`);

    events.addEventListener("project", async () => {
      const snapshot = await getProjectSnapshotAction(project.id);
      if (snapshot && !("error" in snapshot)) {
        setProject(snapshot);
      }
    });

    events.onerror = () => {
      events.close();
    };

    return () => {
      events.close();
    };
  }, [project.id]);

  const handleUpdate = async (id: string, patch: Partial<Project> | ((prev: Project) => Partial<Project>)) => {
    const p = typeof patch === "function" ? patch(project) : patch;
    
    // Update local React state
    setProject(prev => ({ ...prev, ...p }));
    
    // Fire Server Action outside of setState callback to avoid "Cannot update a component while rendering"
    const { lists, ...dbPatch } = p as any;
    updateProjectAction(id, dbPatch);
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
