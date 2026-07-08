"use client";
import { useRouter } from "next/navigation";
import { Home } from "@/components/Home";
import { createProject } from "./actions";
import { MarkasData, Project } from "@/types";

export function HomeClientWrapper({ data, me }: { data: MarkasData, me: string }) {
  const router = useRouter();

  const handleCreate = async (p: Partial<Project>) => {
    const res = await createProject(p);
    if (res?.slug) {
      router.push(`/project/${res.slug}`);
    } else if (res?.id) {
      router.push(`/project/${res.id}`);
    }
  };

  const handleOpen = (slugOrId: string) => {
    router.push(`/project/${slugOrId}`);
  };

  return <Home data={data} createProject={handleCreate} me={me} open={handleOpen} />;
}
