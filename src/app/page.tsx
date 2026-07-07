"use client";
import React, { useState, useEffect } from "react";
import { MarkasData } from "@/types";
import { storage } from "@/lib/storage";
import { C, lurikCSS } from "@/lib/utils";
import { inputStyle, btnPrimary } from "@/lib/styles";
import { Home } from "@/components/Home";
import { Dashboard } from "@/components/Dashboard";
import { Kalender } from "@/components/Kalender";
import { CatatanUmum } from "@/components/CatatanUmum";
import { ProjectPage } from "@/components/ProjectPage";

const EMPTY: MarkasData = { team: [], projects: [], notes: [] };
const KEY = "markas-jm-v1";

export default function Markas() {
  const [data, setData] = useState<MarkasData | null>(null);
  const [me, setMe] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [view, setView] = useState<any>({ page: "home" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      let d = EMPTY;
      try {
        const r = await storage.get(KEY, true);
        if (r?.value) d = JSON.parse(r.value);
      } catch (e) {}
      d.projects = (d.projects || []).map((p) => {
        p.lists = p.lists || [];
        p.threads = p.threads || [];
        p.files = p.files || [];
        p.notes = p.notes || [];
        p.logs = p.logs || [];
        p.targets = p.targets || {};
        p.ads = p.ads || { nonAds: false, entries: [] };
        return p;
      });
      d.notes = d.notes || [];
      d.team = d.team || [];
      setData(d);
      try {
        const m = await storage.get("markas-jm-me");
        if (m?.value) setMe(m.value);
      } catch (e) {}
    })();
  }, []);

  const persist = async (next: MarkasData) => {
    setData(next);
    setSaving(true);
    try { await storage.set(KEY, JSON.stringify(next), true); }
    catch (e) { console.error("Gagal menyimpan", e); }
    setSaving(false);
  };

  const saveMe = async () => {
    const n = nameInput.trim();
    if (!n) return;
    setMe(n);
    try { await storage.set("markas-jm-me", n); } catch (e) {}
    if (data && !data.team.includes(n)) persist({ ...data, team: [...data.team, n] });
  };

  if (!data)
    return <div style={{ padding: 60, textAlign: "center", color: C.inkSoft }}>Memuat Markas…</div>;

  if (!me)
    return (
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
    );

  const project = view.page === "project" ? data.projects.find((p) => p.id === view.id) : null;
  const NAV = [["home", "Proyek"], ["dash", "Dasbor"], ["cal", "Kalender"], ["notes", "Catatan"]];

  return (
    <>
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
    </>
  );
}
