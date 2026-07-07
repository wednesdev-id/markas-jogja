"use client";
import { useState } from "react";
import { Project } from "@/types";
import { uid, today, C } from "@/lib/utils";
import { btnPrimary, btnGhost, cardStyle, inputStyle } from "@/lib/styles";
import { fmtDate } from "@/lib/utils";

export function Todos({ project, update, team }: { project: Project, update: (p: any) => void, team: string[] }) {
  const [newList, setNewList] = useState("");
  const [drafts, setDrafts] = useState<Record<string, any>>({});

  const addList = () => {
    if (!newList.trim()) return;
    update({ lists: [...project.lists, { id: uid(), name: newList.trim(), todos: [] }] });
    setNewList("");
  };
  const setDraft = (lid: string, patch: any) => setDrafts((d) => ({ ...d, [lid]: { text: "", assignee: "", due: "", ...d[lid], ...patch } }));
  const addTodo = (lid: string) => {
    const d = drafts[lid];
    if (!d?.text?.trim()) return;
    update({
      lists: project.lists.map((l) =>
        l.id === lid ? { ...l, todos: [...l.todos, { id: uid(), text: d.text.trim(), assignee: d.assignee || "", due: d.due || "", done: false }] } : l
      ),
    });
    setDraft(lid, { text: "" });
  };
  const toggle = (lid: string, tid: string) =>
    update({ lists: project.lists.map((l) => (l.id === lid ? { ...l, todos: l.todos.map((t) => (t.id === tid ? { ...t, done: !t.done } : t)) } : l)) });
  const removeTodo = (lid: string, tid: string) =>
    update({ lists: project.lists.map((l) => (l.id === lid ? { ...l, todos: l.todos.filter((t) => t.id !== tid) } : l)) });
  const removeList = (lid: string) => update({ lists: project.lists.filter((l) => l.id !== lid) });

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input value={newList} onChange={(e) => setNewList(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addList()}
          placeholder="Daftar tugas baru, mis. Konten Feed · Stories · Artikel · Ads" style={{ ...inputStyle, flex: "1 1 260px" }} />
        <button onClick={addList} style={btnPrimary}>+ Daftar</button>
      </div>

      {project.lists.length === 0 && (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center", color: C.inkSoft }}>
          Buat daftar tugas pertama — misalnya "Konten Feed", "Stories", "Artikel", atau "Ads".
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {project.lists.map((l) => {
          const done = l.todos.filter((t) => t.done).length;
          const d = drafts[l.id] || { text: "", assignee: "", due: "" };
          return (
            <div key={l.id} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16.5 }}>{l.name}</span>
                <span style={{ marginLeft: 10, fontSize: 12.5, color: C.inkSoft }}>{done}/{l.todos.length} selesai</span>
                <button onClick={() => removeList(l.id)} style={{ ...btnGhost, marginLeft: "auto" }}>hapus</button>
              </div>
              <div>
                {l.todos.map((t) => {
                  const late = t.due && !t.done && t.due < today();
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: `1px solid ${C.bg}` }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggle(l.id, t.id)} style={{ width: 17, height: 17, accentColor: C.daun, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 14.5, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#9AA3B8" : C.ink }}>{t.text}</span>
                      {t.assignee && <span style={{ fontSize: 12, background: C.bg, borderRadius: 999, padding: "3px 10px", color: C.inkSoft, whiteSpace: "nowrap" }}>{t.assignee}</span>}
                      {t.due && (
                        <span style={{ fontSize: 12, color: late ? C.bata : C.inkSoft, fontWeight: late ? 700 : 400, whiteSpace: "nowrap" }}>
                          {late ? "⚠ " : ""}{fmtDate(t.due)}
                        </span>
                      )}
                      <button onClick={() => removeTodo(l.id, t.id)} style={btnGhost}>×</button>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 8, padding: "12px 18px", flexWrap: "wrap", background: "#FAFBFC" }}>
                <input value={d.text} onChange={(e) => setDraft(l.id, { text: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addTodo(l.id)}
                  placeholder="Tambah tugas…" style={{ ...inputStyle, flex: "2 1 180px", fontSize: 13.5 }} />
                <select value={d.assignee} onChange={(e) => setDraft(l.id, { assignee: e.target.value })} style={{ ...inputStyle, flex: "0 1 130px", fontSize: 13.5 }}>
                  <option value="">— siapa? —</option>
                  {team.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
                <input type="date" value={d.due} onChange={(e) => setDraft(l.id, { due: e.target.value })} style={{ ...inputStyle, flex: "0 1 140px", fontSize: 13.5 }} />
                <button onClick={() => addTodo(l.id)} style={{ ...btnPrimary, padding: "8px 14px", fontSize: 13.5 }}>Tambah</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
