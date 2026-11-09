import "fake-indexeddb/auto";
import { afterEach, expect, it } from "vitest";
import { db, saveTask, type Task } from "./db";
const task: Task = {
  id: "test",
  title: "  Proyecto final  ",
  description: "Detalles",
  category: "Académica",
  priority: "alta",
  completed: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  due: "",
  location: { latitude: 19, longitude: -99, accuracy: 20 },
};
afterEach(async () => {
  await db.tasks.clear();
  await db.settings.clear();
});
it("persiste, consulta, modifica y elimina actividades con ubicación", async () => {
  await saveTask(task);
  expect((await db.tasks.get("test"))?.title).toBe("Proyecto final");
  expect((await db.tasks.get("test"))?.location?.latitude).toBe(19);
  await saveTask({ ...task, completed: true });
  expect((await db.tasks.get("test"))?.completed).toBe(true);
  await db.tasks.delete("test");
  expect(await db.tasks.count()).toBe(0);
});
it("rechaza títulos vacíos y categorías inválidas", async () => {
  await expect(saveTask({ ...task, title: " " })).rejects.toThrow();
  await expect(saveTask({ ...task, category: "otra" })).rejects.toThrow();
  expect(await db.tasks.count()).toBe(0);
});
it("almacena preferencias de tema y recordatorios", async () => {
  await db.settings.put({
    id: "preferences",
    theme: "oscuro",
    reminders: true,
  });
  expect((await db.settings.get("preferences"))?.reminders).toBe(true);
});
