"use client";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { MarkasData } from "@/types";

export function DashboardClientWrapper({ data, me }: { data: MarkasData, me: string }) {
  const router = useRouter();

  const handleOpen = (id: string) => {
    router.push(`/project/${id}`);
  };

  return <Dashboard data={data} me={me} open={handleOpen} />;
}
