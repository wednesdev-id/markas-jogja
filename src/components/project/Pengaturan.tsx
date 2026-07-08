import { useState } from "react";
import { Project } from "@/types";
import { cardStyle, inputStyle, btnPrimary } from "@/lib/styles";
import { C } from "@/lib/utils";
import { deleteProjectAction } from "@/app/project/[slug]/actions";

export function Pengaturan({ project, update }: { project: Project, update: (p: Partial<Project>) => void }) {
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client || "");

  const handleSave = () => {
    if (!name.trim()) return;
    update({ name: name.trim(), client: client.trim() });
  };

  const handleDelete = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus proyek ini? Semua data, tugas, dan file akan hilang dan tidak dapat dikembalikan.")) {
      const res = await deleteProjectAction(project.id);
      if (res?.success) {
        window.location.href = "/";
      } else {
        alert("Gagal menghapus proyek: " + res?.error);
      }
    }
  };

  return (
    <div style={{ ...cardStyle, padding: 24 }}>
      <h2 style={{ fontSize: 18, marginBottom: 16 }}>Pengaturan Proyek</h2>
      
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Nama Proyek</label>
        <input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          style={{ ...inputStyle, width: "100%", maxWidth: 400 }} 
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500 }}>Nama Klien (Opsional)</label>
        <input 
          value={client} 
          onChange={(e) => setClient(e.target.value)} 
          style={{ ...inputStyle, width: "100%", maxWidth: 400 }} 
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={handleSave} style={btnPrimary}>Simpan Perubahan</button>
      </div>

      <hr style={{ margin: "32px 0", border: 0, borderTop: `1px solid ${C.line}` }} />

      <h2 style={{ fontSize: 18, color: "red", marginBottom: 16 }}>Zona Berbahaya</h2>
      <p style={{ fontSize: 14, color: C.inkSoft, marginBottom: 16 }}>
        Tindakan ini akan menghapus proyek secara permanen dari server.
      </p>
      <button 
        onClick={handleDelete} 
        style={{ ...btnPrimary, background: "white", color: "red", border: "1px solid red" }}
      >
        Hapus Proyek
      </button>
    </div>
  );
}
