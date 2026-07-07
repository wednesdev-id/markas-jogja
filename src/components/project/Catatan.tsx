"use client";
import { useState } from "react";
import { Project, MarkasData } from "@/types";
import { uid, today, fmtDate, C } from "@/lib/utils";
import { btnPrimary, btnGhost, cardStyle, inputStyle } from "@/lib/styles";
import { Mention } from "../Mention";

export function Catatan({ project, update, me, team }: { project: Partial<Project>, update: (p: any) => void, me: string, team: string[] }) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [attendees, setAttendees] = useState<string[]>([]);
  const [body, setBody] = useState("");

  const notes = project.notes || [];
  const toggleAtt = (n: string) => setAttendees((a) => (a.includes(n) ? a.filter((x) => x !== n) : [...a, n]));

  const addNote = () => {
    if (!title.trim() && !body.trim()) return;
    const note = { id: uid(), title: title.trim() || "Catatan meeting", date, attendees, body: body.trim(), author: me, createdAt: Date.now() };
    update({ notes: [note, ...notes] });
    setTitle(""); setBody(""); setAttendees([]); setDate(today()); setShow(false);
  };
  const removeNote = (nid: string) => update({ notes: notes.filter((n) => n.id !== nid) });

  return (
    <div>
      <div style={{ display: "flex", marginBottom: 18, alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => setShow(!show)} style={btnPrimary}>+ Catatan meeting</button>
        <span style={{ fontSize: 12.5, color: C.inkSoft }}>Tips: ketik <b style={{ color: C.kunyit }}>@nama</b> untuk memanggil rekan yang mengerjakan.</span>
      </div>

      {show && (
        <div style={{ ...cardStyle, padding: 18, marginBottom: 18, display: "grid", gap: 12 }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Judul, mis. Meeting mingguan dengan klien" style={{ ...inputStyle, flex: "2 1 220px" }} autoFocus />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, flex: "0 1 150px" }} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 6 }}>Yang hadir:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {team.map((m) => (
                <button key={m} onClick={() => toggleAtt(m)}
                  style={{ borderRadius: 999, padding: "5px 13px", fontSize: 13, fontWeight: 500, border: `1px solid ${attendees.includes(m) ? C.ink : C.line}`, background: attendees.includes(m) ? C.ink : "#fff", color: attendees.includes(m) ? "#fff" : C.ink }}>
                  {m}
                </button>
              ))}
            </div>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7}
            placeholder={"Hasil meeting…\n\nContoh:\n- Klien minta revisi tone warna feed → @Sari kerjakan sebelum Kamis\n- Budget ads naik 20% mulai Agustus → @Bayu update di media plan\n- Follow up konten artikel → @Dian"}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
          <button onClick={addNote} style={{ ...btnPrimary, justifySelf: "start" }}>Simpan catatan</button>
        </div>
      )}

      {notes.length === 0 && !show && (
        <div style={{ ...cardStyle, padding: 32, textAlign: "center", color: C.inkSoft }}>
          Belum ada catatan meeting. Rekam hasil meeting klien atau internal di sini supaya keputusan tidak hilang.
        </div>
      )}

      {notes.map((n) => (
        <div key={n.id} style={{ ...cardStyle, padding: "18px 22px", marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17 }}>{n.title}</div>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 3 }}>
                {fmtDate(n.date)} · dicatat oleh {n.author}
              </div>
            </div>
            <button onClick={() => removeNote(n.id)} style={btnGhost}>hapus</button>
          </div>
          {n.attendees?.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {n.attendees.map((a) => (
                <span key={a} style={{ fontSize: 12, background: C.bg, borderRadius: 999, padding: "3px 11px", color: C.inkSoft }}>{a}</span>
              ))}
            </div>
          )}
          {n.body && (
            <div style={{ fontSize: 14.5, lineHeight: 1.7, whiteSpace: "pre-wrap", marginTop: 12, borderTop: `1px solid ${C.bg}`, paddingTop: 12 }}>
              <Mention text={n.body} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
