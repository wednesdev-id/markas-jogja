"use client";
import { useState } from "react";
import { Project } from "@/types";
import { uid, fmtTime, C } from "@/lib/utils";
import { cardStyle, inputStyle, btnPrimary, btnGhost } from "@/lib/styles";

export function Files({ project, update, me }: { project: Project, update: (p: any) => void, me: string }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("Desain");
  const KINDS = ["Desain", "Brief", "Aset brand", "Laporan", "Dokumen", "Lainnya"];
  const ICON: Record<string, string> = { Desain: "◆", Brief: "▤", "Aset brand": "◈", Laporan: "▦", Dokumen: "▧", Lainnya: "◇" };

  const addFile = () => {
    if (!name.trim() || !url.trim()) return;
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    update({ files: [{ id: uid(), name: name.trim(), url: u, kind, addedBy: me, createdAt: Date.now() }, ...project.files] });
    setName(""); setUrl("");
  };
  const removeFile = (fid: string) => update({ files: project.files.filter((f) => f.id !== fid) });

  return (
    <div>
      <div style={{ ...cardStyle, padding: 18, marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama file, mis. Brand guideline" style={{ ...inputStyle, flex: "2 1 200px" }} />
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Tautan (Google Drive, Figma, Canva…)" style={{ ...inputStyle, flex: "2 1 200px" }} />
        <select value={kind} onChange={(e) => setKind(e.target.value)} style={{ ...inputStyle, flex: "0 1 130px" }}>
          {KINDS.map((k) => <option key={k}>{k}</option>)}
        </select>
        <button onClick={addFile} style={btnPrimary}>Simpan</button>
      </div>
      {project.files.length === 0 && (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center", color: C.inkSoft }}>
          Belum ada file. Simpan tautan Google Drive, Figma, atau Canva di sini supaya satu proyek satu tempat.
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {project.files.map((f) => (
          <div key={f.id} style={{ ...cardStyle, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ fontSize: 20, color: C.kunyit, lineHeight: 1 }}>{ICON[f.kind] || "◇"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <a href={f.url} target="_blank" rel="noreferrer" style={{ fontWeight: 600, fontSize: 14, color: C.ink, textDecoration: "none", wordBreak: "break-word" }}>{f.name} ↗</a>
              <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 3 }}>{f.kind} · {f.addedBy} · {fmtTime(f.createdAt)}</div>
            </div>
            <button onClick={() => removeFile(f.id)} style={btnGhost}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
