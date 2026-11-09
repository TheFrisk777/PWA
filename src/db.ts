import Dexie, { type Table } from "dexie";
export const categories = ["Personal", "Académica", "Laboral"] as const;
export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "alta" | "media" | "baja";
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  due: string;
  location?: { latitude: number; longitude: number; accuracy: number };
};
export type Settings = {
  id: "preferences";
  theme: "claro" | "oscuro";
  reminders: boolean;
};
class TaskDatabase extends Dexie {
  tasks!: Table<Task, string>;
  settings!: Table<Settings, string>;
  constructor() {
    super("taskflow");
    this.version(1).stores({
      tasks: "id, title, category, priority, completed, due",
      settings: "id",
    });
  }
}
export const db = new TaskDatabase();
export function validateTask(task: Task) {
  if (!task.title.trim() || task.title.length > 120)
    throw new Error("Escribe un título de hasta 120 caracteres.");
  if (!categories.includes(task.category as (typeof categories)[number]))
    throw new Error("Categoría inválida.");
  if (!["alta", "media", "baja"].includes(task.priority))
    throw new Error("Prioridad inválida.");
  if (task.due && !Number.isFinite(new Date(task.due).getTime()))
    throw new Error("Fecha inválida.");
}
export async function saveTask(task: Task) {
  validateTask(task);
  await db.tasks.put({
    ...task,
    title: task.title.trim(),
    updatedAt: new Date().toISOString(),
  });
}
