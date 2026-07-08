"use client";

import { useState } from "react";
import { C } from "@/lib/utils";
import { cardStyle, inputStyle, btnPrimary, fieldLabel, h1 } from "@/lib/styles";
import { updateProfileAction } from "@/app/actions";

export function Profile({ profile, email }: { profile: any, email: string }) {
  const [name, setName] = useState(profile?.name || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    const res = await updateProfileAction(name);
    if (res.error) {
      setMessage("Gagal menyimpan: " + res.error);
    } else {
      setMessage("Profil berhasil disimpan.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "40px 20px" }}>
      <h1 style={h1}>Profil Anda</h1>
      <p style={{ color: C.inkSoft, marginTop: 8, marginBottom: 32 }}>Kelola informasi akun Anda di Markas.</p>
      
      <div style={{ ...cardStyle, maxWidth: 600, padding: 32 }}>
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div>
            <label style={{ ...fieldLabel, marginBottom: 6 }}>Email</label>
            <input 
              style={{ ...inputStyle, width: "100%", background: "#f8f9fb", color: "#64748b" }} 
              value={email} 
              disabled 
            />
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>Email tidak dapat diubah saat ini.</p>
          </div>

          <div>
            <label style={{ ...fieldLabel, marginBottom: 6 }}>Nama Lengkap</label>
            <input 
              style={{ ...inputStyle, width: "100%" }} 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Masukkan nama lengkap Anda"
              required 
            />
          </div>
          
          {message && (
            <div style={{ padding: 12, borderRadius: 8, background: message.includes("Gagal") ? "#fee2e2" : "#dcfce7", color: message.includes("Gagal") ? "#991b1b" : "#166534", fontSize: 13, fontWeight: 500 }}>
              {message}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <button type="submit" disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }}>
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
          
        </form>
      </div>
    </div>
  );
}
