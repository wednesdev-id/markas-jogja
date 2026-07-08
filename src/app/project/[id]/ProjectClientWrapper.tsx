"use client";
import { useState } from "react";
import { ProjectPage } from "@/components/ProjectPage";
import { MarkasData, Project } from "@/types";
import { updateProjectAction } from "./actions";

export function ProjectClientWrapper({ detailedProject, data, me }: { detailedProject: Project, data: MarkasData, me: string }) {
  const [project, setProject] = useState<Project>(detailedProject);
  const [view, setView] = useState({ page: "project", id: project.id, tab: "todo" });

  const handleUpdate = async (id: string, patch: Partial<Project>) => {
    // Optimistic Update
    setProject({ ...project, ...patch });

    // Call Server Action
    await updateProjectAction(id, patch);
  };

  const handleSetView = (newView: any) => {
    if (newView.page === "home") {
      window.location.href = "/";
    } else {
      setView(newView);
    }
  };

  return <ProjectPage project={project} data={data} updateProject={handleUpdate} me={me} view={view} setView={handleSetView} />;
}
