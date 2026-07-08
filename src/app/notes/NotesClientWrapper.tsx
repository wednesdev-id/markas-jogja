"use client";
import { useState } from "react";
import { CatatanUmum } from "@/components/CatatanUmum";
import { updateNotesAction } from "./actions";
import { MarkasData } from "@/types";

export function NotesClientWrapper({ data: initialData, me }: { data: MarkasData, me: string }) {
  const [data, setData] = useState(initialData);

  const handleUpdate = async (notes: any[]) => {
    setData({ ...data, notes });
    await updateNotesAction(notes);
  };

  return <CatatanUmum data={data} updateNotes={handleUpdate} me={me} />;
}
