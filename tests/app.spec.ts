import { test, expect } from "@playwright/test";
import fs from "node:fs";
test("notificaciones concedidas y denegadas con alternativa interna", async ({
  page,
}) => {
  await page.goto("/configuracion");
  await page.evaluate(() => {
    Object.defineProperty(Notification, "requestPermission", {
      configurable: true,
      value: async () => "denied",
    });
  });
  await page
    .getByRole("button", { name: "Activar notificaciones del sistema" })
    .click();
  await expect(
    page.getByText("Usaremos recordatorios dentro de la aplicación.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("Mostrar recordatorios")).toBeChecked();
  await page.evaluate(() => {
    Object.defineProperty(Notification, "requestPermission", {
      configurable: true,
      value: async () => "granted",
    });
  });
  await page
    .getByRole("button", { name: "Activar notificaciones del sistema" })
    .click();
  await expect(
    page.getByText("Notificaciones activadas.", { exact: false }),
  ).toBeVisible();
});
test("CRUD, persistencia, rutas offline, manifest y diseño móvil", async ({
  page,
  context,
}) => {
  fs.mkdirSync("docs/evidencias", { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Un buen día empieza con un plan." }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page
    .getByRole("link", { name: "Nueva actividad", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Título de la actividad")
    .fill("Preparar entrega de PWA");
  await page
    .getByLabel("Descripción")
    .fill("Revisar las evidencias del proyecto final");
  await page.getByLabel("Categoría", { exact: true }).selectOption("Académica");
  await page.screenshot({
    path: "docs/evidencias/formulario.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Guardar actividad" }).click();
  await expect(
    page.getByRole("link", { name: "Preparar entrega de PWA", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Preparar entrega de PWA", exact: true }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("Estás sin conexión.", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Preparar entrega de PWA", exact: true })
    .click();
  await page
    .getByLabel("Título de la actividad")
    .fill("Entrega revisada offline");
  await page.getByRole("button", { name: "Guardar actividad" }).click();
  await expect(
    page.getByRole("link", { name: "Entrega revisada offline", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Nueva actividad", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Título de la actividad")
    .fill("Actividad creada offline");
  await page.getByRole("button", { name: "Guardar actividad" }).click();
  await expect(
    page.getByRole("link", { name: "Actividad creada offline", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("link", { name: "Actividad creada offline", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/evidencias/offline.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "Completar: Entrega revisada offline",
      exact: true,
    })
    .click();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.screenshot({
    path: "docs/evidencias/dashboard.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({ path: "docs/evidencias/movil.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  const diagnostic = await page.evaluate(async () => ({
    databases: await indexedDB.databases(),
    serviceWorker: (await navigator.serviceWorker.getRegistration())?.active
      ?.state,
    caches: await caches.keys(),
    controlled: !!navigator.serviceWorker.controller,
    standalone: matchMedia("(display-mode: standalone)").matches,
  }));
  fs.writeFileSync(
    "docs/evidencias/diagnostico.json",
    JSON.stringify(diagnostic, null, 2),
  );
  expect(diagnostic.controlled).toBe(true);
  await context.setOffline(false);
  const manifest = await (await page.request.get("/manifest.json")).json();
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons)
    expect((await page.request.get(icon.src)).status()).toBe(200);
  await page.goto("/actividades");
  await page
    .getByRole("link", { name: "Actividad creada offline", exact: true })
    .click();
  await page.getByRole("button", { name: "Eliminar", exact: true }).click();
  await page.getByRole("button", { name: "Sí, eliminar" }).click();
  await expect(
    page.getByRole("link", { name: "Actividad creada offline", exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("GPS concedido y denegado, tema persistente y alternativa de avisos", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["geolocation"]);
  await context.setGeolocation({ latitude: 19.4326, longitude: -99.1332 });
  await page.goto("/nueva");
  await page.getByLabel("Título de la actividad").fill("Actividad con GPS");
  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(
    page.getByText("19.432600, -99.133200", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guardar actividad" }).click();
  await page
    .getByRole("link", { name: "Actividad con GPS", exact: true })
    .click();
  await expect(
    page.getByText("19.432600, -99.133200", { exact: false }),
  ).toBeVisible();
  await page.screenshot({
    path: "docs/evidencias/geolocalizacion.png",
    fullPage: true,
  });
  await context.clearPermissions();
  await page.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (_success, error) =>
      error?.({
        code: 1,
        message: "Denied",
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
  });
  await page.getByRole("button", { name: "Usar mi ubicación" }).click();
  await expect(page.getByRole("alert")).toContainText("denegado");
  await page.goto("/configuracion");
  await page.getByLabel("Tema", { exact: true }).selectOption("oscuro");
  await page.reload();
  await expect(page.getByLabel("Tema", { exact: true })).toHaveValue("oscuro");
  await page.getByLabel("Mostrar recordatorios").click();
  await expect(page.getByLabel("Mostrar recordatorios")).toBeChecked();
  await page.screenshot({
    path: "docs/evidencias/configuracion.png",
    fullPage: true,
  });
});
