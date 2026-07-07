"use client";
import { MarkasData } from "@/types";
import { C, projectStats, allTasks, today, adsStats, fmtRp, fmtTime, lurikAccent, kontenStats, KONTEN_TYPES, fmtDate } from "@/lib/utils";
import { eyebrow, h1, cardStyle, badge } from "@/lib/styles";

export function Dashboard({ data, me, open }: { data: MarkasData, me: string, open: (id: string) => void }) {
  const rows = data.projects.map((p) => ({ p, s: projectStats(p) }));
  const tasks = allTasks(data);
  const tertinggal = rows.filter((r) => r.s.status.label === "Tertinggal").length;
  const dikejar = rows.filter((r) => r.s.status.label === "Perlu dikejar").length;
  const terlambat = tasks.filter((t) => !t.done && t.due && t.due < today()).length;
  const selesai = tasks.filter((t) => t.done).length;

  const people = [...data.team];
  const perOrang = people.map((m) => {
    const open_ = tasks.filter((t) => t.assignee === m && !t.done);
    return { name: m, open: open_, overdue: open_.filter((t) => t.due && t.due < today()).length };
  });
  const tanpaPJ = tasks.filter((t) => !t.assignee && !t.done);

  const adsBermasalah = rows.filter((r) => adsStats(r.p).masalah).length;
  const adsBelumUpdate = rows.filter((r) => adsStats(r.p).stale).length;

  const CARD = [
    ["Proyek tertinggal", tertinggal, C.merahBg, C.bata],
    ["Perlu dikejar", dikejar, C.kuningBg, "#9A6B00"],
    ["Tugas terlambat", terlambat, C.merahBg, C.bata],
    ["Flag ads bermasalah", adsBermasalah, C.merahBg, C.bata],
    ["Ads belum update", adsBelumUpdate, C.biruBg, C.inkSoft],
    ["Tugas selesai", selesai, C.hijauBg, C.daun],
  ] as const;

  return (
    <div>
      <div style={eyebrow}>Monitoring semua proyek</div>
      <h1 style={h1}>Dasbor</h1>
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 20 }}>
        {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 26 }}>
        {CARD.map(([label, val, bg, fg]) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.1em", color: fg, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: fg, fontFamily: "'Bricolage Grotesque', sans-serif", marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: 30 }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16 }}>
          Progress per proyek
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 620 }}>
            <thead>
              <tr style={{ background: C.ink, color: "#fff", textAlign: "left" }}>
                {["Proyek / Brand", "Tugas", "Selesai", "Terlambat", "Progress", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", fontWeight: 600, fontSize: 12.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: C.inkSoft }}>Belum ada proyek.</td></tr>
              )}
              {rows.map(({ p, s }, i) => (
                <tr key={p.id} onClick={() => open(p.id)} style={{ cursor: "pointer", background: i % 2 ? "#F8F9FB" : "#fff", borderBottom: `1px solid ${C.bg}` }}>
                  <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                    <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: lurikAccent(p.stripe), marginRight: 8 }} />
                    {p.name}
                  </td>
                  <td style={{ padding: "10px 16px" }}>{s.total || "–"}</td>
                  <td style={{ padding: "10px 16px" }}>{s.done || "–"}</td>
                  <td style={{ padding: "10px 16px", color: s.overdue ? C.bata : C.inkSoft, fontWeight: s.overdue ? 700 : 400 }}>{s.overdue || "–"}</td>
                  <td style={{ padding: "10px 16px", minWidth: 130 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 7, background: "#EDEFF3", borderRadius: 99 }}>
                        <div style={{ width: `${s.progress}%`, height: "100%", background: s.progress === 100 ? C.daun : C.kunyit, borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 12, color: C.inkSoft, width: 34 }}>{s.progress}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ ...badge, background: s.status.bg, color: s.status.fg }}>{s.status.label}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: 30 }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16 }}>Monitoring konten per brand</span>
          <span style={{ fontSize: 12.5, color: C.inkSoft }}>
            {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })} · diambil dari tab Log Konten tiap proyek
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 700 }}>
            <thead>
              <tr style={{ background: C.ink, color: "#fff", textAlign: "left" }}>
                {["Brand", "Feed", "Stories", "Artikel", "Ads", "Total", "Progress", "Status"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", fontWeight: 600, fontSize: 12.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 24, textAlign: "center", color: C.inkSoft }}>Belum ada proyek.</td></tr>
              )}
              {rows.map(({ p }, i) => {
                const k = kontenStats(p);
                return (
                  <tr key={p.id} onClick={() => open(p.id)} style={{ cursor: "pointer", background: i % 2 ? "#F8F9FB" : "#fff", borderBottom: `1px solid ${C.bg}` }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: lurikAccent(p.stripe), marginRight: 8 }} />
                      {p.name}
                    </td>
                    {KONTEN_TYPES.map((t) => (
                      <td key={t} style={{ padding: "10px 16px", color: k.counts[t] ? C.ink : "#B9C0CF" }}>{k.counts[t] || "–"}</td>
                    ))}
                    <td style={{ padding: "10px 16px", fontWeight: 700 }}>{k.total || "–"}<span style={{ color: "#B9C0CF", fontWeight: 400 }}>{k.target ? `/${k.target}` : ""}</span></td>
                    <td style={{ padding: "10px 16px", minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 7, background: "#EDEFF3", borderRadius: 99 }}>
                          <div style={{ width: `${k.progress}%`, height: "100%", background: k.progress >= 100 ? C.daun : C.kunyit, borderRadius: 99 }} />
                        </div>
                        <span style={{ fontSize: 12, color: C.inkSoft, width: 34 }}>{k.progress}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ ...badge, background: k.status.bg, color: k.status.fg }}>{k.status.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: 30 }}>
        <div style={{ padding: "14px 18px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16 }}>Monitoring ads per brand</span>
          <span style={{ fontSize: 12.5, color: C.inkSoft }}>diambil dari tab Ads tiap proyek · dianggap "Belum Update" jika tidak disentuh 7 hari</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, minWidth: 640 }}>
            <thead>
              <tr style={{ background: C.ink, color: "#fff", textAlign: "left" }}>
                {["Brand", "Campaign aktif", "Budget", "Spend", "Update terakhir", "Ads Flag"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", fontWeight: 600, fontSize: 12.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: C.inkSoft }}>Belum ada proyek.</td></tr>
              )}
              {rows.map(({ p }, i) => {
                const a = adsStats(p);
                return (
                  <tr key={p.id} onClick={() => open(p.id)} style={{ cursor: "pointer", background: i % 2 ? "#F8F9FB" : "#fff", borderBottom: `1px solid ${C.bg}` }}>
                    <td style={{ padding: "10px 16px", fontWeight: 600 }}>
                      <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: lurikAccent(p.stripe), marginRight: 8 }} />
                      {p.name}
                    </td>
                    <td style={{ padding: "10px 16px" }}>{a.nonAds ? "–" : a.aktif || "–"}</td>
                    <td style={{ padding: "10px 16px" }}>{a.nonAds || !a.budget ? "–" : fmtRp(a.budget)}</td>
                    <td style={{ padding: "10px 16px", color: a.budget && a.spend > a.budget ? C.bata : C.ink, fontWeight: a.budget && a.spend > a.budget ? 700 : 400 }}>
                      {a.nonAds || !a.spend ? "–" : fmtRp(a.spend)}
                    </td>
                    <td style={{ padding: "10px 16px", color: C.inkSoft, fontSize: 12.5 }}>{a.last ? fmtTime(a.last) : "–"}</td>
                    <td style={{ padding: "10px 16px" }}>
                      <span style={{ ...badge, background: a.flag.bg, color: a.flag.fg }}>{a.flag.label}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ ...eyebrow, marginBottom: 10 }}>Siapa mengerjakan apa</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {perOrang.map((o) => (
          <div key={o.name} style={{ ...cardStyle, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 30, height: 30, borderRadius: 99, background: o.name === me ? C.ink : C.bg, color: o.name === me ? "#fff" : C.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>
                {o.name.slice(0, 1).toUpperCase()}
              </span>
              <b style={{ fontSize: 15 }}>{o.name}</b>
              <span style={{ marginLeft: "auto", fontSize: 12.5, color: C.inkSoft }}>
                {o.open.length} aktif{o.overdue ? <b style={{ color: C.bata }}> · {o.overdue} terlambat</b> : ""}
              </span>
            </div>
            {o.open.length === 0 ? (
              <div style={{ fontSize: 13, color: "#9AA3B8", marginTop: 10 }}>Tidak ada tugas aktif 🎉</div>
            ) : (
              <div style={{ marginTop: 10 }}>
                {o.open.slice(0, 5).map((t) => (
                  <div key={t.id} onClick={() => open(t.projectId)} style={{ fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.bg}`, cursor: "pointer", display: "flex", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: lurikAccent(t.stripe), marginTop: 5, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{t.text}<span style={{ color: "#9AA3B8" }}> — {t.projectName}</span></span>
                    {t.due && <span style={{ fontSize: 11.5, color: t.due < today() ? C.bata : C.inkSoft, whiteSpace: "nowrap" }}>{fmtDate(t.due)}</span>}
                  </div>
                ))}
                {o.open.length > 5 && <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 6 }}>+{o.open.length - 5} tugas lain</div>}
              </div>
            )}
          </div>
        ))}
        {tanpaPJ.length > 0 && (
          <div style={{ ...cardStyle, padding: "16px 18px", border: `1px dashed ${C.kunyit}` }}>
            <b style={{ fontSize: 15, color: "#9A6B00" }}>⚠ Belum ada penanggung jawab</b>
            <div style={{ marginTop: 10 }}>
              {tanpaPJ.slice(0, 6).map((t) => (
                <div key={t.id} onClick={() => open(t.projectId)} style={{ fontSize: 13, padding: "6px 0", borderBottom: `1px solid ${C.bg}`, cursor: "pointer" }}>
                  {t.text} <span style={{ color: "#9AA3B8" }}>— {t.projectName}</span>
                </div>
              ))}
              {tanpaPJ.length > 6 && <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 6 }}>+{tanpaPJ.length - 6} lainnya</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
