"use client";
import { useState } from "react";
import { MarkasData, Project } from "@/types";
import { C, uid, lurikCSS, projectStats } from "@/lib/utils";
import { eyebrow, h1, btnPrimary, cardStyle, inputStyle, badge } from "@/lib/styles";
import { ProgressBar } from "./ProgressBar";

export function Home({ data, createProject, me, open }: { data: MarkasData, createProject: (p: Partial<Project>) => void, me: string, open: (id: string) => void }) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");

  const addProject = () => {
    if (!name.trim()) return;
    createProject({ name: name.trim(), client: client.trim(), stripe: data.projects.length % 5 });
    setName(""); setClient(""); setShowNew(false);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 22 }}>
        <div>
          <div style={eyebrow}>Semua proyek</div>
          <h1 style={h1}>Meja kerja tim</h1>
        </div>
        <button onClick={() => setShowNew(!showNew)} style={{ ...btnPrimary, marginLeft: "auto" }}>+ Proyek baru</button>
      </div>

      {showNew && (
        <div style={{ ...cardStyle, padding: 18, marginBottom: 22, display: "flex", flexWrap: "wrap", gap: 10 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama proyek / brand, mis. Kenangan Jogja" style={{ ...inputStyle, flex: "2 1 220px" }} autoFocus />
          <input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Klien (opsional)" style={{ ...inputStyle, flex: "1 1 140px" }} />
          <button onClick={addProject} style={btnPrimary}>Buat</button>
        </div>
      )}

      {data.projects.length === 0 && (
        <div style={{ ...cardStyle, padding: 40, textAlign: "center", color: C.inkSoft }}>
          Belum ada proyek. Buat satu proyek per brand/klien — misalnya Kenangan Jogja, Mojog, Manda Pos.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
        {data.projects.map((p) => {
          const s = projectStats(p);
          return (
            <div key={p.id} onClick={() => open(p.slug || p.id)} style={{ ...cardStyle, cursor: "pointer", overflow: "hidden" }}>
              <div style={{ height: 12, background: lurikCSS(p.stripe) }} />
              <div style={{ padding: "16px 18px 18px" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, lineHeight: 1.25, flex: 1 }}>{p.name}</div>
                  <span style={{ ...badge, background: s.status.bg, color: s.status.fg }}>{s.status.label}</span>
                </div>
                {p.client && <div style={{ fontSize: 13, color: C.inkSoft, marginTop: 3 }}>Klien: {p.client}</div>}
                <ProgressBar pct={s.progress} />
                <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12.5, color: C.inkSoft, flexWrap: "wrap" }}>
                  <span><b style={{ color: C.ink }}>{s.done}/{s.total}</b> tugas</span>
                  <span><b style={{ color: C.ink }}>{s.threads}</b> diskusi</span>
                  <span><b style={{ color: C.ink }}>{s.notes}</b> catatan</span>
                  <span><b style={{ color: C.ink }}>{s.files}</b> file</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 40 }}>
        <div style={{ ...eyebrow, marginBottom: 10 }}>Anggota tim (Semua proyek)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {data.team.map((t) => (
            <span key={t} style={{ background: t === me ? C.ink : "#fff", color: t === me ? "#fff" : C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 14px", fontSize: 13, fontWeight: 500 }}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
