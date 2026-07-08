export interface Todo {
  id: string;
  text: string;
  assignee: string;
  due: string;
  done: boolean;
}

export interface TodoList {
  id: string;
  name: string;
  todos: Todo[];
}

export interface ThreadComment {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface Thread {
  id: string;
  title: string;
  body: string;
  author: string;
  createdAt: number;
  comments: ThreadComment[];
}

export interface FileItem {
  id: string;
  name: string;
  url: string;
  kind: string;
  addedBy: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  body: string;
  author: string;
  createdAt: number;
}

export interface LogKonten {
  id: string;
  date: string;
  type: string;
  judul: string;
  by: string;
  createdAt: number;
}

export interface AdsEntry {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spend: number;
  result: string;
  issue: string;
  status: string;
  updatedAt: number;
  by: string;
}

export interface AdsData {
  nonAds: boolean;
  entries: AdsEntry[];
}

export interface Project {
  id: string;
  slug?: string;
  name: string;
  client: string;
  stripe: number;
  createdAt: number;
  lists: TodoList[];
  threads: Thread[];
  files: FileItem[];
  notes: Note[];
  logs: LogKonten[];
  targets: Record<string, number>;
  ads: AdsData;
}

export interface MarkasData {
  team: string[];
  projects: Project[];
  notes: Note[];
}
