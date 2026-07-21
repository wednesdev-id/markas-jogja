"use client";
import { useState } from "react";
import { Project } from "@/types";
import { today, C } from "@/lib/utils";
import { btnPrimary, btnGhost, cardStyle, inputStyle } from "@/lib/styles";
import { fmtDate } from "@/lib/utils";
import { addListAction, removeListAction, addTodoAction, updateTodoAction, removeTodoAction } from "@/app/project/[slug]/clientActions";

export function Todos({ project, update, team }: { project: Project, update: (p: any) => void, team: string[] }) {
  const [newList, setNewList] = useState("");
  const [drafts, setDrafts] = useState<Record<string, any>>({});

  const addList = async () => {
    if (!newList.trim()) return;
    const name = newList.trim();
    setNewList("");
    
    // Optimistic
    const tempId = "temp-" + Date.now();
    update((prev: Project) => ({ lists: [...prev.lists, { id: tempId, name, todos: [] }] }));
    
    // DB
    const data = await addListAction(project.id, name);
    if (data && "id" in data) {
      update((prev: Project) => ({ lists: prev.lists.map(l => l.id === tempId ? { ...l, id: data.id } : l) }));
    }
  };

  const setDraft = (lid: string, patch: any) => setDrafts((d) => ({ ...d, [lid]: { text: "", assignee: "", due: "", priority: "", ...d[lid], ...patch } }));
  
  const addTodo = async (lid: string) => {
    const d = drafts[lid];
    if (!d?.text?.trim()) return;
    const todoData = { 
      list_id: lid, 
      text: d.text.trim(), 
      assignee: d.assignee || null, 
      due: d.due || null, 
      priority: d.priority || null,
      done: false 
    };
    setDraft(lid, { text: "" });

    // Optimistic
    const tempId = "temp-t-" + Date.now();
    update((prev: Project) => ({
      lists: prev.lists.map((l) =>
        l.id === lid ? { ...l, todos: [...l.todos, { id: tempId, ...todoData, assignee: todoData.assignee || "", due: todoData.due || "", priority: todoData.priority || "" }] } : l
      ),
    }));

    // DB
    const data = await addTodoAction(todoData);
    if (data && "id" in data) {
      update((prev: Project) => ({
        lists: prev.lists.map((l) =>
          l.id === lid ? { ...l, todos: l.todos.map(t => t.id === tempId ? { ...t, id: data.id } : t) } : l
        ),
      }));
    }
  };

  const toggle = async (lid: string, tid: string) => {
    update((prev: Project) => {
      const newLists = prev.lists.map((l) => (l.id === lid ? { ...l, todos: l.todos.map((t) => {
        if (t.id === tid) {
          const newDone = !t.done;
          updateTodoAction(tid, { done: newDone });
          return { ...t, done: newDone };
        }
        return t;
      }) } : l));
      return { lists: newLists };
    });
  };

  const changeAssignee = async (lid: string, tid: string, newAssignee: string) => {
    update((prev: Project) => {
      const newLists = prev.lists.map((l) => (l.id === lid ? { ...l, todos: l.todos.map((t) => {
        if (t.id === tid) {
          updateTodoAction(tid, { assignee: newAssignee || null });
          return { ...t, assignee: newAssignee };
        }
        return t;
      }) } : l));
      return { lists: newLists };
    });
  };

  const removeTodo = async (lid: string, tid: string) => {
    update((prev: Project) => ({ lists: prev.lists.map((l) => (l.id === lid ? { ...l, todos: l.todos.filter((t) => t.id !== tid) } : l)) }));
    await removeTodoAction(tid);
  };

  const removeList = async (lid: string) => {
    update((prev: Project) => ({ lists: prev.lists.filter((l) => l.id !== lid) }));
    await removeListAction(lid);
  };

  const prioColors: any = { High: C.bata, Medium: C.kunyit, Low: C.daun };

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
          const d = drafts[l.id] || { text: "", assignee: "", due: "", priority: "" };
          return (
            <div key={l.id} style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: `1px solid ${C.line}` }}>
                <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16.5 }}>{l.name}</span>
                <span style={{ marginLeft: 10, fontSize: 12.5, color: C.inkSoft }}>{done}/{l.todos.length} selesai</span>
                <button onClick={() => removeList(l.id)} style={{ ...btnGhost, marginLeft: "auto" }}>hapus</button>
              </div>
              <div>
                {l.todos.map((t: any) => {
                  const late = t.due && !t.done && t.due < today();
                  return (
                    <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 18px", borderBottom: `1px solid ${C.bg}` }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggle(l.id, t.id)} style={{ width: 17, height: 17, accentColor: C.daun, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 14.5, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#9AA3B8" : C.ink }}>
                        {t.priority && <span style={{ fontSize: 10, fontWeight: 700, color: prioColors[t.priority], border: `1px solid ${prioColors[t.priority]}`, padding: "1px 4px", borderRadius: 4, marginRight: 6 }}>{t.priority}</span>}
                        {t.text}
                      </span>
                      <select value={t.assignee || ""} onChange={(e) => changeAssignee(l.id, t.id, e.target.value)} style={{ fontSize: 12, background: C.bg, borderRadius: 999, padding: "2px 8px", color: C.inkSoft, border: "none", outline: "none", cursor: "pointer", maxWidth: 120 }}>
                        <option value="">— orang —</option>
                        {team.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
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
              <div style={{ display: "flex", gap: 8, padding: "12px 18px", flexWrap: "wrap", background: "#FAFBFC", alignItems: "center" }}>
                <input value={d.text} onChange={(e) => setDraft(l.id, { text: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addTodo(l.id)}
                  placeholder="Tambah tugas…" style={{ ...inputStyle, flex: "2 1 180px", fontSize: 13.5 }} />
                
                <select value={d.priority} onChange={(e) => setDraft(l.id, { priority: e.target.value })} style={{ ...inputStyle, flex: "0 1 100px", fontSize: 13.5 }}>
                  <option value="">— prioritas —</option>
                  <option value="High">Tinggi (High)</option>
                  <option value="Medium">Sedang (Medium)</option>
                  <option value="Low">Rendah (Low)</option>
                </select>

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
