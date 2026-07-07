import React, { useState, useEffect } from "react";

/* ============================================================
   MARKAS v2 — Ruang kerja internal Jogja Marketing
   Proyek · To-do · Diskusi · Catatan Meeting · File
   + Dasbor monitoring · Kalender deadline · Beban kerja tim
   Data tersimpan bersama (shared) untuk seluruh tim.
   ============================================================ */

const C = {
  ink: "#1D2740", inkSoft: "#4A5570", bg: "#EEF0F4", card: "#FFFFFF",
  line: "#DCE0E8", kunyit: "#DE9A1F", daun: "#2E7D5B", bata: "#B5482E",
  merahBg: "#FBE9E7", kuningBg: "#FCF3D7", hijauBg: "#E3F1EA", biruBg: "#E8EDF7",
};

const LURIK = [
  ["#1D2740", "#DE9A1F", "#F4EFE4"],
  ["#2E4A3B", "#C86B3C", "#EDE7DA"],
  ["#3A2E52", "#B5482E", "#E9E4F0"],
  ["#12414F", "#D9A441", "#E2EDEA"],
  ["#5A2A33", "#1D2740", "#F0E6E2"],
];
const lurikCSS = (i) => {
  const [a, b, c] = LURIK[i % LURIK.length];
  return `repeating-linear-gradient(90deg, ${a} 0 14px, ${c} 14px 18px, ${b} 18px 24px, ${c} 24px 28px)`;
};
const lurikAccent = (i) => LURIK[i % LURIK.length][0];

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};
const fmtTime = (ts) =>
  new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + " · " +
  new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const EMPTY = { team: [], projects: [], notes: [] };
const KEY = "markas-jm-v1";

/* ---------- render @sebutan ---------- */
function Mention({ text }) {
  const parts = String(text || "").split(/(@[A-Za-z0-9_]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <span key={i} style={{ color: C.kunyit, fontWeight: 700, background: "#FCF3D7", borderRadius: 4, padding: "0 3px" }}>{p}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

/* ---------- kumpulkan semua tugas lintas proyek ---------- */
const allTasks = (data) =>
  data.projects.flatMap((p) =>
    p.lists.flatMap((l) =>
      l.todos.map((t) => ({ ...t, projectId: p.id, projectName: p.name, stripe: p.stripe, listName: l.name }))
    )
  );

/* ---------- monitoring ads (padanan B_ADS_MONITORING) ---------- */
const fmtRp = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

const adsStats = (p) => {
  const a = p.ads || { nonAds: false, entries: [] };
  const entries = a.entries || [];
  const aktif = entries.filter((e) => e.status === "Aktif");
  const budget = entries.reduce((s, e) => s + (Number(e.budget) || 0), 0);
  const spend = entries.reduce((s, e) => s + (Number(e.spend) || 0), 0);
  const last = entries.length ? Math.max(...entries.map((e) => e.updatedAt || 0)) : 0;
  const stale = !a.nonAds && (!last || Date.now() - last > 7 * 864e5);
  const masalah = entries.some((e) => e.issue && e.issue.trim());
  let flag;
  if (a.nonAds) flag = { label: "Non Ads", bg: "#F1F2F5", fg: C.inkSoft };
  else if (masalah) flag = { label: "Bermasalah", bg: C.merahBg, fg: C.bata };
  else if (stale) flag = { label: "Belum Update", bg: C.biruBg, fg: C.inkSoft };
  else if (aktif.length) flag = { label: `${aktif.length} Aktif`, bg: C.hijauBg, fg: C.daun };
  else flag = { label: "Tidak ada iklan", bg: "#F1F2F5", fg: C.inkSoft };
  return { nonAds: a.nonAds, entries, aktif: aktif.length, budget, spend, last, stale, masalah, flag };
};

/* ---------- monitoring konten bulanan (padanan INPUT_LOG_KONTEN) ---------- */
const KONTEN_TYPES = ["Feed", "Stories", "Artikel", "Ads"];
const monthKey = () => today().slice(0, 7);

const kontenStats = (p) => {
  const logs = (p.logs || []).filter((l) => l.date && l.date.startsWith(monthKey()));
  const counts = {};
  KONTEN_TYPES.forEach((t) => { counts[t] = logs.filter((l) => l.type === t).length; });
  const targets = p.targets || {};
  const target = KONTEN_TYPES.reduce((a, t) => a + (Number(targets[t]) || 0), 0);
  const total = logs.length;
  const progress = target ? Math.min(100, Math.round((total / target) * 100)) : 0;
  const d = new Date();
  const pace = Math.round((d.getDate() / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()) * 100);
  let status;
  if (!target) status = { label: "Tanpa target", bg: "#F1F2F5", fg: C.inkSoft };
  else if (progress >= 100) status = { label: "Target tercapai", bg: C.hijauBg, fg: C.daun };
  else if (progress >= pace - 10) status = { label: "Sesuai jalur", bg: C.hijauBg, fg: C.daun };
  else if (progress >= pace - 30) status = { label: "Perlu dikejar", bg: C.kuningBg, fg: "#9A6B00" };
  else status = { label: "Tertinggal", bg: C.merahBg, fg: C.bata };
  return { counts, total, target, progress, status, logsMonth: logs };
};

const projectStats = (p) => {
  const all = p.lists.flatMap((l) => l.todos);
  const done = all.filter((t) => t.done).length;
  const overdue = all.filter((t) => !t.done && t.due && t.due < today()).length;
  const progress = all.length ? Math.round((done / all.length) * 100) : 0;
  let status;
  if (all.length === 0) status = { label: "Belum ada tugas", bg: "#F1F2F5", fg: C.inkSoft };
  else if (overdue > 0) status = { label: "Tertinggal", bg: C.merahBg, fg: C.bata };
  else if (progress < 50) status = { label: "Perlu dikejar", bg: C.kuningBg, fg: "#9A6B00" };
  else if (progress === 100) status = { label: "Selesai", bg: C.hijauBg, fg: C.daun };
  else status = { label: "Aman", bg: C.hijauBg, fg: C.daun };
  return { total: all.length, done, overdue, progress, status, threads: p.threads.length, files: p.files.length, notes: (p.notes || []).length };
};

/* ============================================================ APP */
export default function Markas() {
  const [data, setData] = useState(null);
  const [me, setMe] = useState(null);
  const [nameInput, setNameInput] = useState("");
  const [view, setView] = useState({ page: "home" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      let d = EMPTY;
      try {
        const r = await window.storage.get(KEY, true);
        if (r?.value) d = JSON.parse(r.value);
      } catch (e) {}
      d.projects = (d.projects || []).map((p) => ({ notes: [], logs: [], targets: {}, ads: { nonAds: false, entries: [] }, ...p }));
      d.notes = d.notes || [];
      setData(d);
      try {
        const m = await window.storage.get("markas-jm-me");
        if (m?.value) setMe(m.value);
      } catch (e) {}
    })();
  }, []);

  const persist = async (next) => {
    setData(next);
    setSaving(true);
    try { await window.storage.set(KEY, JSON.stringify(next), true); }
    catch (e) { console.error("Gagal menyimpan", e); }
    setSaving(false);
  };

  const saveMe = async () => {
    const n = nameInput.trim();
    if (!n) return;
    setMe(n);
    try { await window.storage.set("markas-jm-me", n); } catch (e) {}
    if (data && !data.team.includes(n)) persist({ ...data, team: [...data.team, n] });
  };

  if (!data)
    return <Shell><div style={{ padding: 60, textAlign: "center", color: C.inkSoft }}>Memuat Markas…</div></Shell>;

  if (!me)
    return (
      <Shell>
        <div style={{ maxWidth: 420, margin: "80px auto", background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ height: 10, background: lurikCSS(0) }} />
          <div style={{ padding: 28 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 26 }}>Selamat datang di Markas</div>
            <p style={{ color: C.inkSoft, fontSize: 14, lineHeight: 1.6, margin: "10px 0 18px" }}>
              Ruang kerja internal Jogja Marketing. Tulis namamu supaya tugas, catatan, dan diskusi tercatat atas namamu.
            </p>
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveMe()} placeholder="Nama panggilanmu, mis. Sari" style={inputStyle} autoFocus />
            <button onClick={saveMe} style={{ ...btnPrimary, width: "100%", marginTop: 12 }}>Masuk ke Markas</button>
          </div>
        </div>
      </Shell>
    );

  const project = view.page === "project" ? data.projects.find((p) => p.id === view.id) : null;
  const NAV = [["home", "Proyek"], ["dash", "Dasbor"], ["cal", "Kalender"], ["notes", "Catatan"]];

  return (
    <Shell>
      <header style={{ background: C.ink, color: "#fff" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto", padding: "12px 20px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
          <div onClick={() => setView({ page: "home" })} style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: "-0.02em" }}>Markas</span>
            <span style={{ fontSize: 11, color: "#AEB8D0", textTransform: "uppercase", letterSpacing: "0.14em" }}>Jogja Marketing</span>
          </div>
          <nav style={{ display: "flex", gap: 4 }}>
            {NAV.map(([k, label]) => (
              <button key={k} onClick={() => setView({ page: k })}
                style={{ background: view.page === k ? "rgba(255,255,255,0.14)" : "none", border: "none", color: view.page === k ? "#fff" : "#AEB8D0", borderRadius: 7, padding: "6px 13px", fontSize: 13.5, fontWeight: 600 }}>
                {label}
              </button>
            ))}
          </nav>
          <div style={{ marginLeft: "auto", fontSize: 13, color: "#C7CFE2" }}>{saving ? "Menyimpan…" : `Halo, ${me}`}</div>
        </div>
        <div style={{ height: 6, background: lurikCSS(project ? project.stripe : 0) }} />
      </header>

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
        {view.page === "home" && <Home data={data} persist={persist} me={me} open={(id) => setView({ page: "project", id, tab: "todo" })} />}
        {view.page === "dash" && <Dashboard data={data} me={me} open={(id) => setView({ page: "project", id, tab: "todo" })} />}
        {view.page === "cal" && <Kalender data={data} open={(id) => setView({ page: "project", id, tab: "todo" })} />}
        {view.page === "notes" && <CatatanUmum data={data} persist={persist} me={me} />}
        {project && <ProjectPage project={project} data={data} persist={persist} me={me} view={view} setView={setView} />}
        {view.page === "project" && !project && (
          <div style={{ color: C.inkSoft }}>Proyek tidak ditemukan. <a onClick={() => setView({ page: "home" })} style={{ color: C.ink, cursor: "pointer", textDecoration: "underline" }}>Kembali</a></div>
        )}
      </main>
    </Shell>
  );
}

/* ============================================================ SHELL */
function Shell({ children }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { outline: 2px solid ${C.kunyit}; outline-offset: 1px; }
        button { cursor: pointer; font-family: inherit; }
        button:hover { filter: brightness(1.06); }
        ::placeholder { color: #9AA3B8; }
      `}</style>
      {children}
    </div>
  );
}

/* ============================================================ BERANDA */
function Home({ data, persist, me, open }) {
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [newMember, setNewMember] = useState("");

  const addProject = () => {
    if (!name.trim()) return;
    const p = { id: uid(), name: name.trim(), client: client.trim(), stripe: data.projects.length % LURIK.length, createdAt: Date.now(), lists: [], threads: [], files: [], notes: [], logs: [], targets: {}, ads: { nonAds: false, entries: [] } };
    persist({ ...data, projects: [p, ...data.projects] });
    setName(""); setClient(""); setShowNew(false);
  };
  const addMember = () => {
    const n = newMember.trim();
    if (!n || data.team.includes(n)) return;
    persist({ ...data, team: [...data.team, n] });
    setNewMember("");
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
            <div key={p.id} onClick={() => open(p.id)} style={{ ...cardStyle, cursor: "pointer", overflow: "hidden" }}>
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
        <div style={{ ...eyebrow, marginBottom: 10 }}>Anggota tim</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          {data.team.map((t) => (
            <span key={t} style={{ background: t === me ? C.ink : "#fff", color: t === me ? "#fff" : C.ink, border: `1px solid ${C.line}`, borderRadius: 999, padding: "5px 14px", fontSize: 13, fontWeight: 500 }}>{t}</span>
          ))}
          <input value={newMember} onChange={(e) => setNewMember(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMember()} placeholder="+ tambah anggota" style={{ ...inputStyle, width: 160, padding: "6px 12px", fontSize: 13 }} />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ pct }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ height: 8, background: "#EDEFF3", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? C.daun : C.kunyit, borderRadius: 99, transition: "width .3s" }} />
      </div>
      <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3, textAlign: "right" }}>{pct}%</div>
    </div>
  );
}

/* ============================================================ DASBOR */
function Dashboard({ data, me, open }) {
  const rows = data.projects.map((p) => ({ p, s: projectStats(p) }));
  const tasks = allTasks(data);
  const tertinggal = rows.filter((r) => r.s.status.label === "Tertinggal").length;
  const dikejar = rows.filter((r) => r.s.status.label === "Perlu dikejar").length;
  const terlambat = tasks.filter((t) => !t.done && t.due && t.due < today()).length;
  const selesai = tasks.filter((t) => t.done).length;

  // beban kerja per orang
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
  ];

  return (
    <div>
      <div style={eyebrow}>Monitoring semua proyek</div>
      <h1 style={h1}>Dasbor</h1>
      <div style={{ fontSize: 13, color: C.inkSoft, marginBottom: 20 }}>
        {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </div>

      {/* kartu ringkasan */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 26 }}>
        {CARD.map(([label, val, bg, fg]) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: "16px 18px", border: `1px solid ${C.line}` }}>
            <div style={{ fontSize: 11.5, textTransform: "uppercase", letterSpacing: "0.1em", color: fg, fontWeight: 700 }}>{label}</div>
            <div style={{ fontSize: 34, fontWeight: 800, color: fg, fontFamily: "'Bricolage Grotesque', sans-serif", marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* tabel per proyek */}
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

      {/* monitoring konten bulan ini — padanan A_KONTEN_PROGRES */}
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

      {/* monitoring ads — padanan B_ADS_MONITORING */}
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

      {/* beban kerja per orang */}
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

/* ============================================================ KALENDER */
function Kalender({ data, open }) {
  const now = new Date();
  const [month, setMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selDate, setSelDate] = useState(null);

  const tasks = allTasks(data).filter((t) => t.due);
  const byDate = {};
  tasks.forEach((t) => { (byDate[t.due] = byDate[t.due] || []).push(t); });

  const y = month.getFullYear(), m = month.getMonth();
  const firstDow = (new Date(y, m, 1).getDay() + 6) % 7; // Senin = 0
  const daysIn = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const iso = (d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
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

/* ============================================================ HALAMAN PROYEK */
function ProjectPage({ project, data, persist, me, view, setView }) {
  const tab = view.tab || "todo";
  const update = (patch) =>
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

/* ============================================================ TO-DO */
function Todos({ project, update, team }) {
  const [newList, setNewList] = useState("");
  const [drafts, setDrafts] = useState({});

  const addList = () => {
    if (!newList.trim()) return;
    update({ lists: [...project.lists, { id: uid(), name: newList.trim(), todos: [] }] });
    setNewList("");
  };
  const setDraft = (lid, patch) => setDrafts((d) => ({ ...d, [lid]: { text: "", assignee: "", due: "", ...d[lid], ...patch } }));
  const addTodo = (lid) => {
    const d = drafts[lid];
    if (!d?.text?.trim()) return;
    update({
      lists: project.lists.map((l) =>
        l.id === lid ? { ...l, todos: [...l.todos, { id: uid(), text: d.text.trim(), assignee: d.assignee || "", due: d.due || "", done: false }] } : l
      ),
    });
    setDraft(lid, { text: "" });
  };
  const toggle = (lid, tid) =>
    update({ lists: project.lists.map((l) => (l.id === lid ? { ...l, todos: l.todos.map((t) => (t.id === tid ? { ...t, done: !t.done } : t)) } : l)) });
  const removeTodo = (lid, tid) =>
    update({ lists: project.lists.map((l) => (l.id === lid ? { ...l, todos: l.todos.filter((t) => t.id !== tid) } : l)) });
  const removeList = (lid) => update({ lists: project.lists.filter((l) => l.id !== lid) });

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

/* ============================================================ LOG KONTEN (padanan INPUT_LOG_KONTEN) */
function KontenLog({ project, update, me }) {
  const [date, setDate] = useState(today());
  const [type, setType] = useState("Feed");
  const [judul, setJudul] = useState("");
  const k = kontenStats(project);
  const targets = project.targets || {};
  const bulanIni = new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  const setTarget = (t, val) =>
    update({ targets: { ...targets, [t]: Math.max(0, Number(val) || 0) } });

  const addLog = () => {
    if (!judul.trim()) return;
    update({ logs: [{ id: uid(), date, type, judul: judul.trim(), by: me, createdAt: Date.now() }, ...(project.logs || [])] });
    setJudul("");
  };
  const removeLog = (lid) => update({ logs: (project.logs || []).filter((l) => l.id !== lid) });

  return (
    <div>
      {/* target bulanan */}
      <div style={{ ...cardStyle, padding: 18, marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
          <b style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 16 }}>Target konten per bulan</b>
          <span style={{ fontSize: 12.5, color: C.inkSoft }}>berlaku tiap bulan · sedang dihitung: {bulanIni}</span>
          <span style={{ ...badge, background: k.status.bg, color: k.status.fg, marginLeft: "auto" }}>{k.status.label}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
          {KONTEN_TYPES.map((t) => (
            <div key={t} style={{ background: "#FAFBFC", border: `1px solid ${C.bg}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{t}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
                <span style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Bricolage Grotesque', sans-serif", color: (Number(targets[t]) || 0) > 0 && k.counts[t] >= Number(targets[t]) ? C.daun : C.ink }}>
                  {k.counts[t]}
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

      {/* input log */}
      <div style={{ ...cardStyle, padding: 18, marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, flex: "0 1 150px" }} />
        <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle, flex: "0 1 120px" }}>
          {KONTEN_TYPES.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input value={judul} onChange={(e) => setJudul(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addLog()}
          placeholder="Judul konten yang sudah tayang, mis. Feed promo menu baru" style={{ ...inputStyle, flex: "2 1 220px" }} />
        <button onClick={addLog} style={btnPrimary}>+ Catat</button>
      </div>

      {/* daftar log bulan ini */}
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

/* ============================================================ ADS MONITORING (padanan B_ADS_MONITORING) */
function AdsTab({ project, update, me }) {
  const ads = project.ads || { nonAds: false, entries: [] };
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Meta");
  const [budget, setBudget] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const PLATFORMS = ["Meta", "Google", "TikTok", "Lainnya"];
  const st = adsStats(project);

  const setAds = (patch) => update({ ads: { ...ads, ...patch } });

  const addEntry = () => {
    if (!name.trim()) return;
    setAds({
      entries: [{ id: uid(), name: name.trim(), platform, budget: Number(budget) || 0, spend: 0, result: "", issue: "", status: "Aktif", updatedAt: Date.now(), by: me }, ...ads.entries],
    });
    setName(""); setBudget("");
  };
  const patchEntry = (eid, patch) =>
    setAds({ entries: ads.entries.map((e) => (e.id === eid ? { ...e, ...patch, updatedAt: Date.now(), by: me } : e)) });
  const removeEntry = (eid) => setAds({ entries: ads.entries.filter((e) => e.id !== eid) });

  const tarikMeta = async () => {
    setAiLoading(true); setAiText("");
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Cek akun Meta Ads saya. Cari campaign yang berkaitan dengan brand "${project.name}"${project.client ? ` (klien: ${project.client})` : ""}. Jawab ringkas dalam bahasa Indonesia dengan format daftar: nama campaign, status (aktif/paused), budget, total spend bulan ini, dan hasil utamanya (leads/reach/klik). Jika tidak ada campaign yang cocok dengan brand itu, sebutkan saja daftar campaign yang tersedia di akun.`,
          }],
          mcp_servers: [{ type: "url", url: "https://mcp.facebook.com/ads", name: "meta-ads" }],
        }),
      });
      const data = await response.json();
      const text = (data.content || []).filter((i) => i.type === "text").map((i) => i.text).join("\n").trim();
      setAiText(text || "Tidak ada respons dari Meta Ads. Pastikan connector Meta Ads masih terhubung.");
    } catch (e) {
      setAiText("Gagal menghubungi Meta Ads: " + e.message);
    }
    setAiLoading(false);
  };

  return (
    <div>
      {/* status & toggle non-ads */}
      <div style={{ ...cardStyle, padding: "14px 18px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <span style={{ ...badge, background: st.flag.bg, color: st.flag.fg }}>{st.flag.label}</span>
        {!ads.nonAds && st.entries.length > 0 && (
          <span style={{ fontSize: 13, color: C.inkSoft }}>
            Budget <b style={{ color: C.ink }}>{fmtRp(st.budget)}</b> · Spend <b style={{ color: st.spend > st.budget && st.budget ? C.bata : C.ink }}>{fmtRp(st.spend)}</b>
            {st.last ? ` · update terakhir ${fmtTime(st.last)}` : ""}
          </span>
        )}
        <label style={{ marginLeft: "auto", fontSize: 13, color: C.inkSoft, display: "flex", alignItems: "center", gap: 7, cursor: "pointer" }}>
          <input type="checkbox" checked={ads.nonAds} onChange={(e) => setAds({ nonAds: e.target.checked })} style={{ accentColor: C.ink }} />
          Brand ini tidak beriklan (Non Ads)
        </label>
      </div>

      {ads.nonAds ? (
        <div style={{ ...cardStyle, padding: 28, textAlign: "center", color: C.inkSoft }}>
          Ditandai <b>Non Ads</b> — brand ini tidak akan dihitung sebagai "Belum Update" di dasbor.
        </div>
      ) : (
        <>
          {/* tarik dari Meta Ads */}
          <div style={{ ...cardStyle, padding: 18, marginBottom: 16, borderLeft: `4px solid ${C.kunyit}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <b style={{ fontSize: 14.5 }}>Tarik ringkasan dari Meta Ads</b>
                <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 2 }}>
                  Ambil data campaign asli dari akun Meta Ads yang terhubung — lalu salin angkanya ke entri di bawah.
                </div>
              </div>
              <button onClick={tarikMeta} disabled={aiLoading} style={{ ...btnPrimary, background: aiLoading ? "#9AA3B8" : C.kunyit }}>
                {aiLoading ? "Mengambil data…" : "⟳ Tarik data"}
              </button>
            </div>
            {aiText && (
              <div style={{ marginTop: 14, background: "#FAFBFC", border: `1px solid ${C.bg}`, borderRadius: 10, padding: "14px 16px", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {aiText}
              </div>
            )}
          </div>

          {/* tambah campaign */}
          <div style={{ ...cardStyle, padding: 18, marginBottom: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addEntry()}
              placeholder="Nama campaign, mis. Leads Promo Juli" style={{ ...inputStyle, flex: "2 1 200px" }} />
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ ...inputStyle, flex: "0 1 110px" }}>
              {PLATFORMS.map((pl) => <option key={pl}>{pl}</option>)}
            </select>
            <input type="number" min="0" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget (Rp)" style={{ ...inputStyle, flex: "1 1 130px" }} />
            <button onClick={addEntry} style={btnPrimary}>+ Campaign</button>
          </div>

          {st.entries.length === 0 && (
            <div style={{ ...cardStyle, padding: 28, textAlign: "center", color: C.inkSoft }}>
              Belum ada campaign tercatat. Tambahkan campaign di atas, lalu update spend & hasilnya rutin (minimal seminggu sekali) supaya tidak berstatus "Belum Update".
            </div>
          )}

          {st.entries.map((e) => (
            <div key={e.id} style={{ ...cardStyle, padding: "16px 18px", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, background: C.biruBg, borderRadius: 6, padding: "3px 9px" }}>{e.platform}</span>
                <b style={{ fontSize: 15, flex: 1, minWidth: 160 }}>{e.name}</b>
                <select value={e.status} onChange={(ev) => patchEntry(e.id, { status: ev.target.value })}
                  style={{ ...inputStyle, padding: "5px 9px", fontSize: 13, color: e.status === "Aktif" ? C.daun : C.inkSoft, fontWeight: 600 }}>
                  {["Aktif", "Paused", "Selesai"].map((s) => <option key={s}>{s}</option>)}
                </select>
                <button onClick={() => removeEntry(e.id)} style={btnGhost}>×</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 12 }}>
                <label style={fieldLabel}>Budget (Rp)
                  <input type="number" min="0" value={e.budget || ""} onChange={(ev) => patchEntry(e.id, { budget: Number(ev.target.value) || 0 })} style={{ ...inputStyle, width: "100%", marginTop: 4 }} />
                </label>
                <label style={fieldLabel}>Spend (Rp)
                  <input type="number" min="0" value={e.spend || ""} onChange={(ev) => patchEntry(e.id, { spend: Number(ev.target.value) || 0 })}
                    style={{ ...inputStyle, width: "100%", marginTop: 4, color: e.budget && e.spend > e.budget ? C.bata : C.ink, fontWeight: e.budget && e.spend > e.budget ? 700 : 400 }} />
                </label>
                <label style={fieldLabel}>Hasil (leads/reach/klik)
                  <input value={e.result || ""} onChange={(ev) => patchEntry(e.id, { result: ev.target.value })} placeholder="mis. 45 leads" style={{ ...inputStyle, width: "100%", marginTop: 4 }} />
                </label>
                <label style={fieldLabel}>Kendala (kosongkan jika aman)
                  <input value={e.issue || ""} onChange={(ev) => patchEntry(e.id, { issue: ev.target.value })} placeholder="mis. ditolak review"
                    style={{ ...inputStyle, width: "100%", marginTop: 4, borderColor: e.issue ? C.bata : C.line }} />
                </label>
              </div>
              <div style={{ fontSize: 11.5, color: "#9AA3B8", marginTop: 10 }}>Update terakhir: {fmtTime(e.updatedAt)} oleh {e.by}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ============================================================ CATATAN UMUM (di luar proyek) */
function CatatanUmum({ data, persist, me }) {
  return (
    <div>
      <div style={eyebrow}>Di luar proyek</div>
      <h1 style={h1}>Catatan umum</h1>
      <p style={{ fontSize: 13.5, color: C.inkSoft, margin: "6px 0 22px", maxWidth: 560, lineHeight: 1.6 }}>
        Untuk hal yang tidak menempel ke satu proyek: rapat internal kantor, evaluasi bulanan,
        SOP tim, ide kampanye, atau info umum lainnya.
      </p>
      <Catatan
        project={{ notes: data.notes }}
        update={(patch) => persist({ ...data, ...patch })}
        me={me}
        team={data.team}
      />
    </div>
  );
}

/* ============================================================ CATATAN MEETING */
function Catatan({ project, update, me, team }) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [attendees, setAttendees] = useState([]);
  const [body, setBody] = useState("");

  const notes = project.notes || [];
  const toggleAtt = (n) => setAttendees((a) => (a.includes(n) ? a.filter((x) => x !== n) : [...a, n]));

  const addNote = () => {
    if (!title.trim() && !body.trim()) return;
    const note = { id: uid(), title: title.trim() || "Catatan meeting", date, attendees, body: body.trim(), author: me, createdAt: Date.now() };
    update({ notes: [note, ...notes] });
    setTitle(""); setBody(""); setAttendees([]); setDate(today()); setShow(false);
  };
  const removeNote = (nid) => update({ notes: notes.filter((n) => n.id !== nid) });

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

/* ============================================================ DISKUSI */
function Diskusi({ project, update, me, view, setView }) {
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [comment, setComment] = useState("");

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
        t.id === thread.id ? { ...t, comments: [...t.comments, { id: uid(), author: me, text: comment.trim(), createdAt: Date.now() }] } : t
      ),
    });
    setComment("");
  };
  const removeThread = (tid) => {
    update({ threads: project.threads.filter((t) => t.id !== tid) });
    setView({ ...view, threadId: null });
  };

  if (thread)
    return (
      <div>
        <a onClick={() => setView({ ...view, threadId: null })} style={{ fontSize: 13, color: C.inkSoft, cursor: "pointer" }}>← Semua diskusi</a>
        <div style={{ ...cardStyle, padding: 24, marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 22, fontWeight: 700, margin: 0, flex: 1 }}>{thread.title}</h2>
            <button onClick={() => removeThread(thread.id)} style={btnGhost}>hapus</button>
          </div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, margin: "6px 0 14px" }}>{thread.author} · {fmtTime(thread.createdAt)}</div>
          {thread.body && <p style={{ fontSize: 15, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: 0 }}><Mention text={thread.body} /></p>}
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ ...eyebrow, marginBottom: 10 }}>{thread.comments.length} komentar</div>
          {thread.comments.map((c) => (
            <div key={c.id} style={{ ...cardStyle, padding: "14px 18px", marginBottom: 10 }}>
              <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 4 }}><b style={{ color: C.ink }}>{c.author}</b> · {fmtTime(c.createdAt)}</div>
              <div style={{ fontSize: 14.5, lineHeight: 1.6, whiteSpace: "pre-wrap" }}><Mention text={c.text} /></div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Tulis komentar… (@nama untuk memanggil)" rows={2}
              style={{ ...inputStyle, flex: 1, resize: "vertical", fontFamily: "inherit" }} />
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
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Tulis isi pengumuman atau bahan diskusi… (@nama untuk memanggil)" style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }} />
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
          <div style={{ fontSize: 12.5, color: C.inkSoft, marginTop: 4 }}>{t.author} · {fmtTime(t.createdAt)} · {t.comments.length} komentar</div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================ FILE */
function Files({ project, update, me }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState("Desain");
  const KINDS = ["Desain", "Brief", "Aset brand", "Laporan", "Dokumen", "Lainnya"];
  const ICON = { Desain: "◆", Brief: "▤", "Aset brand": "◈", Laporan: "▦", Dokumen: "▧", Lainnya: "◇" };

  const addFile = () => {
    if (!name.trim() || !url.trim()) return;
    let u = url.trim();
    if (!/^https?:\/\//i.test(u)) u = "https://" + u;
    update({ files: [{ id: uid(), name: name.trim(), url: u, kind, addedBy: me, createdAt: Date.now() }, ...project.files] });
    setName(""); setUrl("");
  };
  const removeFile = (fid) => update({ files: project.files.filter((f) => f.id !== fid) });

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

/* ============================================================ GAYA */
const cardStyle = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, boxShadow: "0 1px 2px rgba(29,39,64,0.05)" };
const inputStyle = { border: `1px solid ${C.line}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: C.ink };
const btnPrimary = { background: C.ink, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 14, fontWeight: 600 };
const btnSmall = { ...btnPrimary, padding: "5px 13px", fontSize: 15 };
const btnGhost = { background: "none", border: "none", color: "#9AA3B8", fontSize: 13, padding: "2px 6px" };
const badge = { fontSize: 11.5, fontWeight: 700, borderRadius: 999, padding: "3px 11px", whiteSpace: "nowrap" };
const eyebrow = { fontSize: 12, textTransform: "uppercase", letterSpacing: "0.14em", color: C.inkSoft };
const fieldLabel = { fontSize: 12, color: C.inkSoft, fontWeight: 600, display: "block" };
const h1 = { fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 30, margin: "4px 0 0", fontWeight: 800 };
