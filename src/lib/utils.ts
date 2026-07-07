import { Project, Todo, LogKonten } from "@/types";

export const C = {
  ink: "#1D2740", inkSoft: "#4A5570", bg: "#EEF0F4", card: "#FFFFFF",
  line: "#DCE0E8", kunyit: "#DE9A1F", daun: "#2E7D5B", bata: "#B5482E",
  merahBg: "#FBE9E7", kuningBg: "#FCF3D7", hijauBg: "#E3F1EA", biruBg: "#E8EDF7",
};

export const LURIK = [
  ["#1D2740", "#DE9A1F", "#F4EFE4"],
  ["#2E4A3B", "#C86B3C", "#EDE7DA"],
  ["#3A2E52", "#B5482E", "#E9E4F0"],
  ["#12414F", "#D9A441", "#E2EDEA"],
  ["#5A2A33", "#1D2740", "#F0E6E2"],
];

export const lurikCSS = (i: number) => {
  const [a, b, c] = LURIK[i % LURIK.length];
  return `repeating-linear-gradient(90deg, ${a} 0 14px, ${c} 14px 18px, ${b} 18px 24px, ${c} 24px 28px)`;
};
export const lurikAccent = (i: number) => LURIK[i % LURIK.length][0];

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const today = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (iso: string) => {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" }) + " · " +
  new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export const fmtRp = (n: number | string) => "Rp" + Number(n || 0).toLocaleString("id-ID");

/* ---------- kumpulkan semua tugas lintas proyek ---------- */
export const allTasks = (data: { projects: Project[] }) =>
  data.projects.flatMap((p) =>
    p.lists.flatMap((l) =>
      l.todos.map((t) => ({ ...t, projectId: p.id, projectName: p.name, stripe: p.stripe, listName: l.name }))
    )
  );

/* ---------- monitoring ads ---------- */
export const adsStats = (p: Project) => {
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

/* ---------- monitoring konten bulanan ---------- */
export const KONTEN_TYPES = ["Feed", "Stories", "Artikel", "Ads"];
export const monthKey = () => today().slice(0, 7);

export const kontenStats = (p: Project) => {
  const logs = (p.logs || []).filter((l) => l.date && l.date.startsWith(monthKey()));
  const counts: Record<string, number> = {};
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

export const projectStats = (p: Project) => {
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
