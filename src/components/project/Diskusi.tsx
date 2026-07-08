"use client";
import { useState } from "react";
import { Project } from "@/types";
import { uid, fmtTime, C } from "@/lib/utils";
import { btnPrimary, btnGhost, cardStyle, inputStyle, eyebrow } from "@/lib/styles";
import { Mention } from "../Mention";

export function Diskusi({ project, update, me, view, setView, team }: { project: Project, update: (p: any) => void, me: string, view: any, setView: (v: any) => void, team: string[] }) {
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [comment, setComment] = useState("");

  const [editingThread, setEditingThread] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");

  const [mentionState, setMentionState] = useState<{ query: string, field: string } | null>(null);
  const handleTextChange = (val: string, field: string, setter: (v: string) => void) => {
    setter(val);
    const match = val.match(/@([a-zA-Z0-9_]*)$/);
    if (match) {
      setMentionState({ query: match[1].toLowerCase(), field });
    } else {
      if (mentionState?.field === field) setMentionState(null);
    }
  };
  const insertMention = (name: string, val: string, setter: (v: string) => void) => {
    setter(val.replace(/@[a-zA-Z0-9_]*$/, `@${name} `));
    setMentionState(null);
  };

  const thread = view.threadId ? project.threads.find((t) => t.id === view.threadId) : null;

  const addThread = () => {
    if (!title.trim()) return;
    const t = { id: uid(), title: title.trim(), body: body.trim(), author: me, createdAt: Date.now(), comments: [] };
    update({ threads: [t, ...project.threads] });
    setTitle(""); setBody(""); setShowNew(false);
    setView({ ...view, threadId: t.id });
  };
  const addComment = () => {
    if (!comment.trim() || !thread) return;
    update({
      threads: project.threads.map((t) =>
        t.id === thread.id ? { ...t, comments: [...(t.comments || []), { id: uid(), author: me, text: comment.trim(), createdAt: Date.now() }] } : t
      ),
    });
    setComment("");
  };
  const removeThread = (tid: string) => {
    update({ threads: project.threads.filter((t) => t.id !== tid) });
    setView({ ...view, threadId: null });
  };

  const saveThread = () => {
    if (!editTitle.trim() || !thread) return;
    update({ threads: project.threads.map((t) => (t.id === thread.id ? { ...t, title: editTitle.trim(), body: editBody.trim() } : t)) });
    setEditingThread(false);
  };

  const saveComment = (cid: string) => {
    if (!editCommentText.trim() || !thread) return;
    update({
      threads: project.threads.map((t) =>
        t.id === thread.id ? { ...t, comments: (t.comments || []).map((c: any) => (c.id === cid ? { ...c, text: editCommentText.trim() } : c)) } : t
      ),
    });
    setEditingCommentId(null);
  };
  const removeComment = (cid: string) => {
    if (!thread) return;
    update({
      threads: project.threads.map((t) => (t.id === thread.id ? { ...t, comments: (t.comments || []).filter((c: any) => c.id !== cid) } : t)),
    });
  };

  if (thread)
    return (
      <div>
        <a onClick={() => setView({ ...view, threadId: null })} style={{ fontSize: 13, color: C.inkSoft, cursor: "pointer" }}>← Semua diskusi</a>
        
        {editingThread ? (
          <div style={{ ...cardStyle, padding: 24, marginTop: 12, display: "grid", gap: 10 }}>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Judul diskusi" style={inputStyle} autoFocus />
            <div style={{ position: "relative" }}>
              <textarea value={editBody} onChange={(e) => handleTextChange(e.target.value, 'editBody', setEditBody)} rows={4} placeholder="Isi diskusi…" style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
              {mentionState?.field === 'editBody' && team.filter(t => t.toLowerCase().includes(mentionState.query)).length > 0 && (
                <div style={{ position: "absolute", bottom: "100%", left: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxHeight: 150, overflowY: "auto", minWidth: 200 }}>
                  {team.filter(t => t.toLowerCase().includes(mentionState.query)).map(t => (
                    <div key={t} onClick={() => insertMention(t, editBody, setEditBody)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14 }}>{t}</div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={saveThread} style={btnPrimary}>Simpan</button>
              <button onClick={() => setEditingThread(false)} style={btnGhost}>Batal</button>
            </div>
          </div>
        ) : (
          <div style={{ ...cardStyle, padding: 24, marginTop: 12 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700, margin: 0, flex: 1 }}>{thread.title}</h2>
              {thread.author === me && <button onClick={() => { setEditTitle(thread.title); setEditBody(thread.body || ""); setEditingThread(true); }} style={btnGhost}>edit</button>}
              <button onClick={() => removeThread(thread.id)} style={btnGhost}>hapus</button>
            </div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, margin: "6px 0 14px" }}>{thread.author} · {fmtTime(thread.createdAt)}</div>
            {thread.body && <p style={{ fontSize: 15, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: 0 }}><Mention text={thread.body} /></p>}
          </div>
        )}

        <div style={{ marginTop: 20 }}>
          <div style={{ ...eyebrow, marginBottom: 10 }}>{(thread.comments || []).length} komentar</div>
          {(thread.comments || []).map((c: any) => (
            <div key={c.id} style={{ ...cardStyle, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ fontSize: 12.5, color: C.inkSoft }}><b style={{ color: C.ink }}>{c.author}</b> · {fmtTime(c.createdAt)}</div>
                {c.author === me && editingCommentId !== c.id && (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => { setEditCommentText(c.text); setEditingCommentId(c.id); }} style={{ ...btnGhost, padding: "2px 6px", fontSize: 11 }}>edit</button>
                    <button onClick={() => removeComment(c.id)} style={{ ...btnGhost, padding: "2px 6px", fontSize: 11 }}>hapus</button>
                  </div>
                )}
              </div>
              {editingCommentId === c.id ? (
                <div style={{ display: "grid", gap: 8, marginTop: 6 }}>
                  <div style={{ position: "relative" }}>
                    <textarea value={editCommentText} onChange={(e) => handleTextChange(e.target.value, 'editCommentText', setEditCommentText)} rows={2} style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} autoFocus />
                    {mentionState?.field === 'editCommentText' && team.filter(t => t.toLowerCase().includes(mentionState.query)).length > 0 && (
                      <div style={{ position: "absolute", bottom: "100%", left: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxHeight: 150, overflowY: "auto", minWidth: 200 }}>
                        {team.filter(t => t.toLowerCase().includes(mentionState.query)).map(t => (
                          <div key={t} onClick={() => insertMention(t, editCommentText, setEditCommentText)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14 }}>{t}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => saveComment(c.id)} style={{ ...btnPrimary, padding: "4px 12px", fontSize: 12 }}>Simpan</button>
                    <button onClick={() => setEditingCommentId(null)} style={{ ...btnGhost, padding: "4px 12px", fontSize: 12 }}>Batal</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}><Mention text={c.text} /></div>
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <textarea value={comment} onChange={(e) => handleTextChange(e.target.value, 'comment', setComment)} placeholder="Tulis komentar… (@nama untuk memanggil)" rows={2}
                style={{ ...inputStyle, width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }} />
              {mentionState?.field === 'comment' && team.filter(t => t.toLowerCase().includes(mentionState.query)).length > 0 && (
                <div style={{ position: "absolute", bottom: "100%", left: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxHeight: 150, overflowY: "auto", minWidth: 200 }}>
                  {team.filter(t => t.toLowerCase().includes(mentionState.query)).map(t => (
                    <div key={t} onClick={() => insertMention(t, comment, setComment)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14 }}>{t}</div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={addComment} style={{ ...btnPrimary, alignSelf: "flex-end" }}>Kirim</button>
          </div>
        </div>
      </div>
    );

  return (
    <div>
      <div style={{ display: "flex", marginBottom: 18 }}>
        <button onClick={() => setShowNew(!showNew)} style={btnPrimary}>+ Diskusi baru</button>
      </div>
      {showNew && (
        <div style={{ ...cardStyle, padding: 18, marginBottom: 18, display: "grid", gap: 10 }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul, mis. Revisi konsep feed minggu ke-2" style={inputStyle} autoFocus />
          <div style={{ position: "relative" }}>
            <textarea value={body} onChange={(e) => handleTextChange(e.target.value, 'body', setBody)} rows={4} placeholder="Tulis isi pengumuman atau bahan diskusi… (@nama untuk memanggil)" style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", width: "100%", boxSizing: "border-box" }} />
            {mentionState?.field === 'body' && team.filter(t => t.toLowerCase().includes(mentionState.query)).length > 0 && (
              <div style={{ position: "absolute", bottom: "100%", left: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.15)", maxHeight: 150, overflowY: "auto", minWidth: 200 }}>
                {team.filter(t => t.toLowerCase().includes(mentionState.query)).map(t => (
                  <div key={t} onClick={() => insertMention(t, body, setBody)} style={{ padding: "8px 12px", cursor: "pointer", fontSize: 14 }}>{t}</div>
                ))}
              </div>
            )}
          </div>
          <button onClick={addThread} style={{ ...btnPrimary, justifySelf: "start" }}>Terbitkan</button>
        </div>
      )}
      {project.threads.length === 0 && !showNew && (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center", color: C.inkSoft }}>
          Belum ada diskusi. Pindahkan obrolan penting dari WhatsApp ke sini supaya terarsip per proyek.
        </div>
      )}
      {project.threads.map((t) => (
        <div key={t.id} onClick={() => setView({ ...view, threadId: t.id })} style={{ ...cardStyle, padding: "16px 20px", marginBottom: 10, cursor: "pointer" }}>
          <div style={{ fontWeight: 600, fontSize: 15.5 }}>{t.title}</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 4 }}>{t.author} · {fmtTime(t.createdAt)} · {(t.comments || []).length} komentar</div>
        </div>
      ))}
    </div>
  );
}
