import { NextRequest } from "next/server";
import { assertProjectAccess, requireUser } from "@/lib/authz";
import { ProjectEvent, subscribeProjectEvents } from "@/lib/project-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  try {
    const user = await requireUser();
    await assertProjectAccess(user.id, id);
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (chunk: string) => {
        controller.enqueue(encoder.encode(chunk));
      };

      const sendEvent = (event: ProjectEvent) => {
        send(`event: project\n`);
        send(`data: ${JSON.stringify(event)}\n\n`);
      };

      send(`event: ready\n`);
      send(`data: ${JSON.stringify({ projectId: id, timestamp: Date.now() })}\n\n`);

      unsubscribe = subscribeProjectEvents(id, sendEvent);
      heartbeat = setInterval(() => {
        send(`: keepalive ${Date.now()}\n\n`);
      }, 30000);
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
