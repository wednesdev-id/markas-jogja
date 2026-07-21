import "server-only";

export type ProjectEvent = {
  type: "project" | "list" | "todo" | "member";
  projectId: string;
  timestamp: number;
};

type Listener = (event: ProjectEvent) => void;

const globalForProjectEvents = globalThis as unknown as {
  projectEventListeners?: Map<string, Set<Listener>>;
};

const listeners =
  globalForProjectEvents.projectEventListeners ??
  new Map<string, Set<Listener>>();

globalForProjectEvents.projectEventListeners = listeners;

export function subscribeProjectEvents(projectId: string, listener: Listener) {
  const projectListeners = listeners.get(projectId) ?? new Set<Listener>();
  projectListeners.add(listener);
  listeners.set(projectId, projectListeners);

  return () => {
    projectListeners.delete(listener);
    if (projectListeners.size === 0) {
      listeners.delete(projectId);
    }
  };
}

export function publishProjectEvent(event: Omit<ProjectEvent, "timestamp">) {
  const projectEvent = {
    ...event,
    timestamp: Date.now(),
  };

  listeners.get(event.projectId)?.forEach((listener) => listener(projectEvent));
}
