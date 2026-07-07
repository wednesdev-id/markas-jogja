"use client";
import { MarkasData } from "@/types";
import { eyebrow, h1 } from "@/lib/styles";
import { C } from "@/lib/utils";
import { Catatan } from "./project/Catatan";

export function CatatanUmum({ data, updateNotes, me }: { data: MarkasData, updateNotes: (notes: any[]) => void, me: string }) {
  return (
    <div>
      <div style={eyebrow}>Di luar proyek</div>
      <h1 style={h1}>Catatan umum</h1>
      <p style={{ fontSize: 13.5, color: C.inkSoft, margin: "6px 0 22px", maxWidth: 560, lineHeight: 1.6 }}>
        Untuk hal yang tidak menempel ke satu proyek: rapat internal kantor, evaluasi bulanan,
        SOP tim, ide kampanye, atau info umum lainnya.
      </p>
      <Catatan
        project={{ notes: data.notes } as any}
        update={(patch) => updateNotes(patch.notes)}
        me={me}
        team={data.team}
      />
    </div>
  );
}
