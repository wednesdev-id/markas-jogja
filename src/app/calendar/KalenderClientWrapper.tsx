"use client";
import { useRouter } from "next/navigation";
import { Kalender } from "@/components/Kalender";

export function KalenderClientWrapper({ tasks }: { tasks: any[] }) {
  const router = useRouter();

  const handleOpen = (slugOrId: string) => {
    router.push(`/project/${slugOrId}`);
  };

  return <Kalender tasks={tasks} open={handleOpen} />;
}
