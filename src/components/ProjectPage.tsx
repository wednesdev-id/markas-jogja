"use client";
import { Project, MarkasData } from "@/types";
import { C, projectStats } from "@/lib/utils";
import { h1, badge } from "@/lib/styles";
import { Todos } from "./project/Todos";
import { KontenLog } from "./project/KontenLog";
import { AdsTab } from "./project/AdsTab";
import { Diskusi } from "./project/Diskusi";
import { Catatan } from "./project/Catatan";
import { Files } from "./project/Files";

export function ProjectPage({ project, data, persist, me, view, setView }: { project: Project, data: MarkasData, persist: (d: MarkasData) => void, me: string, view: any, setView: (v: any) => void }) {
  const tab = view.tab || "todo";
  const update = (patch: any) =>
    persist({ ...data, projects: data.projects.map((p) => (p.id === project.id ? { ...p, ...patch } : p)) });

  const tabs = [["todo", "To-do"], ["konten", "Log Konten"], ["ads", "Ads"], ["diskusi", "Diskusi"], ["catatan", "Catatan"], ["file", "File"]];
  const s = projectStats(project);

  return (
    <div>
      <a onClick={() => setView({ page: "home" })} style={{ fontSize: 13, color: C.inkSoft, cursor: "pointer" }}>← Semua proyek</a>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", margin: "8px 0 4px" }}>
        <h1 style={{ ...h1, margin: 0 }}>{project.name}</h1>
        <span style={{ ...badge, background: s.status.bg, color: s.status.fg }}>{s.status.label}</span>
        {project.client && <span style={{ fontSize: 14, color: C.inkSoft }}>Klien: {project.client}</span>}
      </div>

      <div style={{ display: "flex", gap: 6, margin: "18px 0 22px", borderBottom: `1px solid ${C.line}`, overflowX: "auto" }}>
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setView({ ...view, tab: k, threadId: null })}
            style={{ background: "none", border: "none", padding: "8px 14px", fontSize: 14.5, whiteSpace: "nowrap",
              fontWeight: tab === k ? 700 : 500, color: tab === k ? C.ink : C.inkSoft,
              borderBottom: tab === k ? `3px solid ${C.kunyit}` : "3px solid transparent", marginBottom: -1 }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "todo" && <Todos project={project} update={update} team={data.team} />}
      {tab === "konten" && <KontenLog project={project} update={update} me={me} />}
      {tab === "ads" && <AdsTab project={project} update={update} me={me} />}
      {tab === "diskusi" && <Diskusi project={project} update={update} me={me} view={view} setView={setView} />}
      {tab === "catatan" && <Catatan project={project} update={update} me={me} team={data.team} />}
      {tab === "file" && <Files project={project} update={update} me={me} />}
    </div>
  );
}
