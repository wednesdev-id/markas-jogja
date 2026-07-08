"use client";
import { useState } from "react";
import { Project } from "@/types";
import { uid, adsStats, fmtRp, fmtTime, C } from "@/lib/utils";
import { cardStyle, btnPrimary, btnGhost, badge, inputStyle, fieldLabel } from "@/lib/styles";

export function AdsTab({ project, update, me }: { project: Project, update: (p: any) => void, me: string }) {
  const ads = project.ads || { nonAds: false, entries: [] };
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("Meta");
  const [budget, setBudget] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState("");
  const PLATFORMS = ["Meta", "Google", "TikTok", "Lainnya"];
  const st = adsStats(project);

  const setAds = (patch: any) => update({ ads: { ...ads, ...patch } });

  const addEntry = () => {
    if (!name.trim()) return;
    setAds({
      entries: [{ id: uid(), name: name.trim(), platform, budget: Number(budget) || 0, spend: 0, result: "", issue: "", status: "Aktif", updatedAt: Date.now(), by: me }, ...ads.entries],
    });
    setName(""); setBudget("");
  };
  const patchEntry = (eid: string, patch: any) =>
    setAds({ entries: ads.entries.map((e) => (e.id === eid ? { ...e, ...patch, updatedAt: Date.now(), by: me } : e)) });
  const removeEntry = (eid: string) => setAds({ entries: ads.entries.filter((e) => e.id !== eid) });

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
      const text = (data.content || []).filter((i: any) => i.type === "text").map((i: any) => i.text).join("\n").trim();
      setAiText(text || "Tidak ada respons dari Meta Ads. Pastikan connector Meta Ads masih terhubung.");
    } catch (e: any) {
      setAiText("Gagal menghubungi Meta Ads: " + e.message);
    }
    setAiLoading(false);
  };

  return (
    <div>
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
            <CampaignEntryRow key={e.id} e={e} patchEntry={patchEntry} removeEntry={removeEntry} />
          ))}
        </>
      )}
    </div>
  );
}

function CampaignEntryRow({ e, patchEntry, removeEntry }: { e: any, patchEntry: (id: string, patch: any) => void, removeEntry: (id: string) => void }) {
  const [budget, setBudget] = useState(e.budget);
  const [spend, setSpend] = useState(e.spend);
  const [result, setResult] = useState(e.result);
  const [issue, setIssue] = useState(e.issue);

  return (
    <div style={{ ...cardStyle, padding: "16px 18px", marginBottom: 12 }}>
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
          <input type="number" min="0" value={budget || ""} onChange={(ev) => setBudget(Number(ev.target.value) || 0)} onBlur={() => patchEntry(e.id, { budget })} style={{ ...inputStyle, width: "100%", marginTop: 4 }} />
        </label>
        <label style={fieldLabel}>Spend (Rp)
          <input type="number" min="0" value={spend || ""} onChange={(ev) => setSpend(Number(ev.target.value) || 0)} onBlur={() => patchEntry(e.id, { spend })}
            style={{ ...inputStyle, width: "100%", marginTop: 4, color: budget && spend > budget ? C.bata : C.ink, fontWeight: budget && spend > budget ? 700 : 400 }} />
        </label>
        <label style={fieldLabel}>Hasil (leads/reach/klik)
          <input value={result || ""} onChange={(ev) => setResult(ev.target.value)} onBlur={() => patchEntry(e.id, { result })} placeholder="mis. 45 leads" style={{ ...inputStyle, width: "100%", marginTop: 4 }} />
        </label>
        <label style={fieldLabel}>Kendala (kosongkan jika aman)
          <input value={issue || ""} onChange={(ev) => setIssue(ev.target.value)} onBlur={() => patchEntry(e.id, { issue })} placeholder="mis. ditolak review"
            style={{ ...inputStyle, width: "100%", marginTop: 4, borderColor: issue ? C.bata : C.line }} />
        </label>
      </div>
      <div style={{ fontSize: 11.5, color: "#9AA3B8", marginTop: 10 }}>Update terakhir: {fmtTime(e.updatedAt)} oleh {e.by}</div>
    </div>
  );
}
