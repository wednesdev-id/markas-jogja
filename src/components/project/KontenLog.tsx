"use client";
import { useState } from "react";
import { Project } from "@/types";
import { kontenStats, KONTEN_TYPES, uid, today, fmtDate, C } from "@/lib/utils";
import { btnPrimary, btnGhost, cardStyle, inputStyle, eyebrow, badge } from "@/lib/styles";

export function KontenLog({ project, update, me }: { project: Project, update: (p: any) => void, me: string }) {
  const [date, setDate] = useState(today());
  const [type, setType] = useState("Feed");
  const [judul, setJudul] = useState("");
  const [filterMonth, setFilterMonth] = useState(today().slice(0, 7));
  const dFormat = new Date(filterMonth + "-01");
  const bulanIni = dFormat.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  const k = kontenStats(project, filterMonth);
  const targets = project.targets || {};

  const setTarget = (t: string, val: string) =>
    update({ targets: { ...targets, [t]: Math.max(0, Number(val) || 0) } });

  const addLog = () => {
    if (!judul.trim()) return;
    update({ logs: [{ id: uid(), date, type, judul: judul.trim(), by: me, createdAt: Date.now() }, ...(project.logs || [])] });
    setJudul("");
  };
  const removeLog = (lid: string) => update({ logs: (project.logs || []).filter((l) => l.id !== lid) });

  return (
    <div>
      <div style={{ ...cardStyle, padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16 }}>Target konten per bulan</b>
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={{ ...inputStyle, padding: "2px 8px", fontSize: 12.5 }} />
          <span style={{ fontSize: 12.5, color: C.inkSoft }}>berlaku tiap bulan · sedang dihitung: {bulanIni}</span>
          <span style={{ ...badge, background: k.status.bg, color: k.status.fg, marginLeft: "auto" }}>{k.status.label}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {KONTEN_TYPES.map((t) => (
            <div key={t} style={{ background: "#FAFBFC", border: `1px solid ${C.bg}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: (Number(targets[t]) || 0) > 0 && (k.counts[t] || 0) >= Number(targets[t]) ? C.daun : C.ink }}>
                  {k.counts[t] || 0}
                </span>
                <span style={{ fontSize: 13, color: C.inkSoft }}>/</span>
                <input type="number" min="0" value={targets[t] ?? ""} placeholder="0"
                  onChange={(e) => setTarget(t, e.target.value)}
                  style={{ ...inputStyle, width: 58, padding: "4px 8px", fontSize: 14, textAlign: "center" }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: C.inkSoft, marginBottom: 4 }}>
            <span>Total konten bulan ini: <b style={{ color: C.ink }}>{k.total}/{k.target || "?"}</b></span>
            <span>{k.progress}%</span>
          </div>
          <div style={{ height: 9, background: "#EDEFF3", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ width: `${k.progress}%`, height: "100%", background: k.progress >= 100 ? C.daun : C.kunyit, borderRadius: 99, transition: "width .3s" }} />
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 18, marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, flex: "0 1 150px" }} />
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle, flex: "0 1 120px" }}>
          {KONTEN_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input value={judul} onChange={(e) => setJudul(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLog()}
          placeholder="Judul konten yang sudah tayang, mis. Feed promo menu baru" style={{ ...inputStyle, flex: "2 1 220px" }} />
        <button onClick={addLog} style={btnPrimary}>+ Catat</button>
      </div>

      <div style={{ ...eyebrow, marginBottom: 10 }}>Log konten {bulanIni} ({k.logsMonth.length})</div>
      {k.logsMonth.length === 0 && (
        <div style={{ ...cardStyle, padding: 28, textAlign: "center", color: C.inkSoft }}>
          Belum ada konten tercatat bulan ini. Setiap konten yang tayang, catat di sini — dasbor akan menghitung progresnya otomatis.
        </div>
      )}
      {k.logsMonth
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((l) => (
          <div key={l.id} style={{ ...cardStyle, padding: "11px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, background: C.biruBg, color: C.ink, borderRadius: 6, padding: "3px 9px", whiteSpace: "nowrap" }}>{l.type}</span>
            <span style={{ flex: 1, fontSize: 14 }}>{l.judul}</span>
            <span style={{ fontSize: 12, color: C.inkSoft, whiteSpace: "nowrap" }}>{l.by} · {fmtDate(l.date)}</span>
            <button onClick={() => removeLog(l.id)} style={btnGhost}>×</button>
          </div>
        ))}
    </div>
  );
}
