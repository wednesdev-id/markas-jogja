"use client";
import { useRouter } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { MarkasData } from "@/types";

export function DashboardClientWrapper({ data, me }: { data: MarkasData, me: string }) {
  const router = useRouter();

  const handleOpen = (slugOrId: string) => {
    router.push(`/project/${slugOrId}`);
  };

  return <Dashboard data={data} me={me} open={handleOpen} />;
}
