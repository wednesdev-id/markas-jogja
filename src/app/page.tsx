"use client";
import React, { useState, useEffect } from "react";
import { MarkasData, Project } from "@/types";
import { createClient } from "@/utils/supabase/client";
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
  const supabase = createClient();
  const [data, setData] = useState<MarkasData | null>(null);
  const [me, setMe] = useState<any>(null); // Now stores the user object
  const [view, setView] = useState<any>({ page: "home" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let channel: any;
    
    (async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', authData.user.id).single();
      const userName = profile?.name || authData.user.email?.split('@')[0] || 'User';
      setMe({ ...authData.user, name: userName });

      const fetchData = async () => {
        const { data: projectsData } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        const { data: profileData } = await supabase.from('profiles').select('notes').eq('id', authData.user.id).single();
        // Fetch unique team members
        const { data: membersData } = await supabase.from('project_members').select('profiles(name)');
        const teamSet = new Set<string>();
        teamSet.add(userName);
        membersData?.forEach((m: any) => m.profiles?.name && teamSet.add(m.profiles.name));

        const parsedProjects = (projectsData || []).map(p => {
          const d = typeof p.data === 'string' ? JSON.parse(p.data) : (p.data || {});
          return {
            id: p.id,
            name: p.name,
            client: p.client || "",
            stripe: p.stripe || 0,
            lists: d.lists || [],
            threads: d.threads || [],
            files: d.files || [],
            notes: d.notes || [],
            logs: d.logs || [],
            targets: d.targets || {},
            ads: d.ads || { nonAds: false, entries: [] },
            createdAt: new Date(p.created_at).getTime()
          } as Project;
        });

        setData({
          team: Array.from(teamSet),
          projects: parsedProjects,
          notes: profileData?.notes || []
        });
      };

      await fetchData();

      // Realtime subscription
      channel = supabase.channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchData)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, fetchData)
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const createProject = async (p: Partial<Project>) => {
    if (!me) return;
    setSaving(true);
    const newId = crypto.randomUUID();
    const projectData = { lists: [], threads: [], files: [], notes: [], logs: [], targets: {}, ads: { nonAds: false, entries: [] } };
    
    // Optimistic UI
    const opt: Project = { id: newId, name: p.name!, client: p.client!, stripe: p.stripe!, createdAt: Date.now(), ...projectData };
    setData(prev => prev ? { ...prev, projects: [opt, ...prev.projects] } : null);
    
    await supabase.from('projects').insert({
      id: newId,
      name: p.name,
      client: p.client,
      stripe: p.stripe,
      data: projectData,
      owner_id: me.id
    });
    setSaving(false);
  };

  const updateProject = async (id: string, patch: Partial<Project>) => {
    setSaving(true);
    // Optimistic UI
    setData(prev => prev ? { ...prev, projects: prev.projects.map(p => p.id === id ? { ...p, ...patch } : p) } : null);

    const { name, client, stripe, createdAt, ...dataPayload } = patch as any;
    
    // Get existing to merge correctly in DB, or just update the whole data column
    const { data: existing } = await supabase.from('projects').select('data').eq('id', id).single();
    const mergedData = { ...(existing?.data || {}), ...dataPayload };
    
    const updatePayload: any = { data: mergedData, updated_at: new Date().toISOString() };
    if (name !== undefined) updatePayload.name = name;
    if (client !== undefined) updatePayload.client = client;
    if (stripe !== undefined) updatePayload.stripe = stripe;

    await supabase.from('projects').update(updatePayload).eq('id', id);
    setSaving(false);
  };

  const updateNotes = async (notes: any[]) => {
    if (!me) return;
    setData(prev => prev ? { ...prev, notes } : null);
    await supabase.from('profiles').update({ notes }).eq('id', me.id);
  };


  const [localData, setLocalData] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.projects && parsed.projects.length > 0) {
          setLocalData(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const migrateLocalData = async () => {
    if (!localData || !me) return;
    setSaving(true);
    
    try {
      // Migrate Projects
      for (const p of localData.projects) {
        const { id, name, client, stripe, createdAt, ...restData } = p;
        await supabase.from('projects').insert({
          id: id || crypto.randomUUID(),
          name: name || 'Proyek Tanpa Nama',
          client: client || '',
          stripe: stripe || 0,
          data: restData,
          owner_id: me.id
        });
      }
      
      // Migrate Notes
      if (localData.notes && localData.notes.length > 0) {
        const { data: profile } = await supabase.from('profiles').select('notes').eq('id', me.id).single();
        const existingNotes = profile?.notes || [];
        await supabase.from('profiles').update({ notes: [...existingNotes, ...localData.notes] }).eq('id', me.id);
      }
      
      localStorage.removeItem(KEY);
      setLocalData(null);
      alert('Migrasi data selesai! Proyek lama Anda berhasil dipindahkan ke Cloud.');
    } catch (err: any) {
      alert('Gagal memigrasi data: ' + err.message);
    }
    
    setSaving(false);
  };

  if (!data)
    return <div style={{ padding: 60, textAlign: "center", color: C.inkSoft }}>Memuat Markas…</div>;

  if (!me)
    return <div style={{ padding: 60, textAlign: "center", color: C.inkSoft }}>Memuat Sesi…</div>;

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
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "#C7CFE2" }}>{saving ? "Menyimpan…" : `Halo, ${me.name}`}</span>
            <form action="/auth/logout" method="post" style={{ margin: 0 }}>
              <button style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", padding: "4px 10px", borderRadius: 4, fontSize: 12, cursor: "pointer" }} formAction={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}>Keluar</button>
            </form>
          </div>
        </div>
        <div style={{ height: 6, background: lurikCSS(project ? project.stripe : 0) }} />
      </header>

      {localData && (
        <div style={{ background: '#FEF3C7', borderBottom: '1px solid #FDE68A', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#92400E', fontWeight: 500 }}>
            Terdapat {localData.projects.length} proyek lama di perangkat ini yang belum tersimpan di Cloud.
          </span>
          <button onClick={migrateLocalData} disabled={saving} style={{ ...btnPrimary, background: '#D97706', padding: '6px 12px', fontSize: 12 }}>
            {saving ? 'Memigrasi...' : 'Migrasikan Sekarang'}
          </button>
        </div>
      )}

      <main style={{ maxWidth: 1080, margin: "0 auto", padding: "26px 20px 80px" }}>
        {view.page === "home" && <Home data={data} createProject={createProject} me={me.name} open={(id) => setView({ page: "project", id, tab: "todo" })} />}
        {view.page === "dash" && <Dashboard data={data} me={me.name} open={(id) => setView({ page: "project", id, tab: "todo" })} />}
        {view.page === "cal" && <Kalender data={data} open={(id) => setView({ page: "project", id, tab: "todo" })} />}
        {view.page === "notes" && <CatatanUmum data={data} updateNotes={updateNotes} me={me.name} />}
        {project && <ProjectPage project={project} data={data} updateProject={updateProject} me={me.name} view={view} setView={setView} />}
        {view.page === "project" && !project && (
          <div style={{ color: C.inkSoft }}>Proyek tidak ditemukan. <a onClick={() => setView({ page: "home" })} style={{ color: C.ink, cursor: "pointer", textDecoration: "underline" }}>Kembali</a></div>
        )}
      </main>
    </>
  );
}
