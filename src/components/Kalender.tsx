"use client";
import { useState } from "react";
import { MarkasData } from "@/types";
import { allTasks, today, fmtDate, lurikAccent, C } from "@/lib/utils";
import { eyebrow, h1, btnSmall, cardStyle } from "@/lib/styles";

export function Kalender({ data, open }: { data: MarkasData, open: (id: string) => void }) {
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selDate, setSelDate] = useState<string | null>(null);

  const tasks = allTasks(data).filter((t) => t.due);
  const byDate: Record<string, typeof tasks> = {};
  tasks.forEach((t) => { (byDate[t.due] = byDate[t.due] || []).push(t); });

  const y = month.getFullYear(), m = month.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // Senin = 0
  const daysIn = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const iso = (d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const monthName = month.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const monthTasks = tasks
    .filter((t) => t.due.startsWith(`${y}-${String(m + 1).padStart(2, "0")}`))
    .sort((a, b) => a.due.localeCompare(b.due));
  const shown = selDate ? (byDate[selDate] || []) : monthTasks;

  return (
    <div>
      <div style={eyebrow}>Deadline semua proyek</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
        <h1 style={{ ...h1, margin: 0 }}>Kalender</h1>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => { setMonth(new Date(y, m - 1, 1)); setSelDate(null); }} style={btnSmall}>‹</button>
          <b style={{ fontSize: 15, minWidth: 140, textAlign: "center" }}>{monthName}</b>
          <button onClick={() => { setMonth(new Date(y, m + 1, 1)); setSelDate(null); }} style={btnSmall}>›</button>
        </div>
      </div>

      <div style={{ ...cardStyle, padding: 14, marginBottom: 20, overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, minWidth: 560 }}>
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((d) => (
            <div key={d} style={{ fontSize: 11.5, textAlign: "center", color: C.inkSoft, fontWeight: 700, padding: "4px 0", textTransform: "uppercase", letterSpacing: "0.08em" }}>{d}</div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const dISO = iso(d);
            const list = byDate[dISO] || [];
            const isToday = dISO === today();
            const isSel = dISO === selDate;
            return (
              <div key={i} onClick={() => setSelDate(isSel ? null : dISO)}
                style={{ minHeight: 72, border: `1.5px solid ${isSel ? C.kunyit : C.bg}`, background: isToday ? "#FCF6E6" : "#fff", borderRadius: 8, padding: 6, cursor: "pointer" }}>
                <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 600, color: isToday ? C.kunyit : C.ink }}>{d}</div>
                {list.slice(0, 3).map((t) => (
                  <div key={t.id} title={`${t.text} — ${t.projectName}`}
                    style={{ fontSize: 10.5, background: t.done ? "#EDEFF3" : lurikAccent(t.stripe), color: t.done ? "#9AA3B8" : "#fff", borderRadius: 4, padding: "1.5px 5px", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: t.done ? "line-through" : "none" }}>
                    {t.text}
                  </div>
                ))}
                {list.length > 3 && <div style={{ fontSize: 10, color: C.inkSoft, marginTop: 2 }}>+{list.length - 3}</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...eyebrow, marginBottom: 10 }}>
        {selDate ? `Deadline ${fmtDate(selDate)}` : `Semua deadline ${monthName}`}
        {selDate && <a onClick={() => setSelDate(null)} style={{ marginLeft: 10, color: C.kunyit, cursor: "pointer", textTransform: "none", letterSpacing: 0 }}>tampilkan sebulan</a>}
      </div>
      {shown.length === 0 && <div style={{ ...cardStyle, padding: 26, textAlign: "center", color: C.inkSoft }}>Tidak ada deadline.</div>}
      {shown.map((t) => (
        <div key={t.id} onClick={() => open(t.projectId)} style={{ ...cardStyle, padding: "12px 16px", marginBottom: 8, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: lurikAccent(t.stripe), flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: 14, textDecoration: t.done ? "line-through" : "none", color: t.done ? "#9AA3B8" : C.ink }}>
            {t.text} <span style={{ color: "#9AA3B8" }}>— {t.projectName} · {t.listName}</span>
          </span>
          {t.assignee && <span style={{ fontSize: 12, background: C.bg, borderRadius: 999, padding: "3px 10px", color: C.inkSoft }}>{t.assignee}</span>}
          <span style={{ fontSize: 12.5, fontWeight: 600, color: !t.done && t.due < today() ? C.bata : C.inkSoft, whiteSpace: "nowrap" }}>{fmtDate(t.due)}</span>
        </div>
      ))}
    </div>
  );
}
