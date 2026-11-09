import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  ClipboardList,
  Download,
  LayoutDashboard,
  Leaf,
  MapPin,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings as SettingsIcon,
  Sun,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { categories, db, saveTask, type Task, type Settings } from "./db";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
const formatDate = (value: string) =>
  value
    ? new Intl.DateTimeFormat("es-MX", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value))
    : "Sin fecha límite";
const nav = [
  ["/", "Dashboard", LayoutDashboard],
  ["/actividades", "Mis actividades", ClipboardList],
  ["/nueva", "Nueva actividad", Plus],
  ["/estadisticas", "Estadísticas", BarChart3],
  ["/configuracion", "Configuración", SettingsIcon],
] as const;
export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]),
    [loading, setLoading] = useState(true),
    [fatal, setFatal] = useState(false),
    [message, setMessage] = useState(""),
    [online, setOnline] = useState(navigator.onLine),
    [mobile, setMobile] = useState(false),
    [install, setInstall] = useState<InstallEvent | null>(null),
    [installHelp, setInstallHelp] = useState(false),
    [prefs, setPrefs] = useState<Settings>({
      id: "preferences",
      theme: "claro",
      reminders: false,
    }),
    [permission, setPermission] = useState(
      "Notification" in window ? Notification.permission : "no disponible",
    ),
    [now, setNow] = useState(Date.now());
  const notified = useRef(new Set<string>());
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError: () =>
      setMessage(
        "No se pudo activar el modo offline. Revisa tu conexión y recarga.",
      ),
  });
  const notify = (text: string) => setMessage(text);
  const reload = async () => setTasks(await db.tasks.toArray());
  useEffect(() => {
    (async () => {
      try {
        await reload();
        const p = await db.settings.get("preferences");
        if (p) setPrefs(p);
      } catch {
        setFatal(true);
        notify(
          "No se puede abrir IndexedDB. Habilita el almacenamiento de este sitio para guardar actividades.",
        );
      } finally {
        setLoading(false);
      }
    })();
    const on = () => setOnline(navigator.onLine);
    const prompt = (e: Event) => {
      e.preventDefault();
      setInstall(e as InstallEvent);
    };
    window.addEventListener("online", on);
    window.addEventListener("offline", on);
    window.addEventListener("beforeinstallprompt", prompt);
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", on);
      window.removeEventListener("beforeinstallprompt", prompt);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = prefs.theme;
  }, [prefs.theme]);
  useEffect(() => {
    if (!prefs.reminders) return;
    for (const task of tasks) {
      const key = task.id + task.due;
      if (
        !task.completed &&
        task.due &&
        new Date(task.due).getTime() <= now &&
        !notified.current.has(key)
      ) {
        notified.current.add(key);
        notify(`Recordatorio: ${task.title}`);
        if ("Notification" in window && Notification.permission === "granted")
          navigator.serviceWorker?.ready
            .then((r) =>
              r.showNotification("TaskFlow · Actividad pendiente", {
                body: task.title,
                icon: "/icons/icon-192.png",
                tag: task.id,
              }),
            )
            .catch(() => notify(`Recordatorio: ${task.title}`));
      }
    }
  }, [tasks, prefs.reminders, now]);
  async function mutate(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      await reload();
      notify(success);
      return true;
    } catch {
      notify(
        "No se pudo guardar el cambio. Revisa el almacenamiento disponible e inténtalo de nuevo.",
      );
      return false;
    }
  }
  async function preference(change: Partial<Settings>) {
    const value = { ...prefs, ...change };
    try {
      await db.settings.put(value);
      setPrefs(value);
      notify("Preferencias guardadas.");
    } catch {
      notify("No se pudieron guardar las preferencias.");
    }
  }
  async function requestPermission() {
    if (!("Notification" in window)) {
      notify(
        "Este navegador no admite notificaciones. Los avisos aparecerán dentro de TaskFlow.",
      );
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      await preference({ reminders: true });
      notify(
        result === "granted"
          ? "Notificaciones activadas. Los recordatorios funcionan mientras TaskFlow está abierta."
          : "Usaremos recordatorios dentro de la aplicación. Puedes cambiar el permiso en tu navegador.",
      );
    } catch {
      notify(
        "No se pudo solicitar el permiso. Los avisos seguirán disponibles dentro de la app.",
      );
    }
  }
  const completed = tasks.filter((t) => t.completed).length,
    pending = tasks.length - completed,
    overdue = tasks.filter(
      (t) => !t.completed && t.due && new Date(t.due).getTime() < now,
    ),
    rate = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  async function toggle(t: Task) {
    await mutate(
      () => saveTask({ ...t, completed: !t.completed }),
      t.completed ? "Actividad pendiente." : "¡Actividad completada!",
    );
  }
  function Cards({ items }: { items: Task[] }) {
    return items.length ? (
      <div className="task-list">
        {items.map((t) => (
          <article
            className={`task-card ${t.completed ? "done" : ""}`}
            key={t.id}
          >
            <button
              className="check-button"
              aria-label={`${t.completed ? "Marcar pendiente" : "Completar"}: ${t.title}`}
              onClick={() => toggle(t)}
            >
              {t.completed ? <Check size={18} /> : <Circle size={23} />}
            </button>
            <div className="task-body">
              <div className="task-meta">
                <span className={`category ${t.category}`}>{t.category}</span>
                <span className={`priority ${t.priority}`}>● {t.priority}</span>
              </div>
              <Link className="task-title" to={`/editar/${t.id}`}>
                {t.title}
              </Link>
              {t.description && <p>{t.description}</p>}
              <div className="task-footer">
                <span
                  className={
                    !t.completed && t.due && new Date(t.due).getTime() < now
                      ? "late"
                      : ""
                  }
                >
                  <CalendarDays size={13} />
                  {formatDate(t.due)}
                </span>
                {t.location && (
                  <span
                    title={`${t.location.latitude}, ${t.location.longitude}`}
                  >
                    <MapPin size={13} />
                    Ubicación guardada
                  </span>
                )}
              </div>
            </div>
            <Link
              className="icon-button"
              to={`/editar/${t.id}`}
              aria-label={`Editar ${t.title}`}
            >
              <MoreHorizontal size={21} />
            </Link>
          </article>
        ))}
      </div>
    ) : (
      <div className="empty">
        <CheckCheck size={36} />
        <h3>Espacio para lo que sigue</h3>
        <p>Crea una actividad y empieza a organizar tu día.</p>
        <Link to="/nueva" className="button primary">
          <Plus size={16} />
          Crear actividad
        </Link>
      </div>
    );
  }
  function Statistics() {
    return (
      <div className="stats">
        <div className="stat">
          <span>
            <ClipboardList size={18} />
            Total de actividades
          </span>
          <strong>
            {tasks.length}
            <small>En tu espacio</small>
          </strong>
        </div>
        <div className="stat">
          <span>
            <Circle size={18} />
            Pendientes
          </span>
          <strong>
            {pending}
            <small>Un paso a la vez</small>
          </strong>
        </div>
        <div className="stat">
          <span>
            <CheckCheck size={18} />
            Completadas
          </span>
          <strong>
            {completed}
            <small>Trabajo que ya hiciste</small>
          </strong>
        </div>
        <div className="stat">
          <span>
            <CalendarDays size={18} />
            Vencidas
          </span>
          <strong>
            {overdue.length}
            <small>Necesitan tu atención</small>
          </strong>
        </div>
      </div>
    );
  }
  function Dashboard() {
    const selected = [...tasks]
      .filter((t) => !t.completed)
      .sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"))
      .slice(0, 4);
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">TU ESPACIO PERSONAL</div>
            <h1>
              Un buen día empieza con un plan<span>.</span>
            </h1>
            <p>Organiza tus pendientes. Haz espacio para lo que importa.</p>
          </div>
          <Link className="button primary" to="/nueva">
            <Plus size={18} />
            Nueva actividad
          </Link>
        </div>
        <section className="hero">
          <div>
            <span className="hero-label">
              <span className="tiny-dot" />A TU RITMO, TODOS LOS DÍAS
            </span>
            <h2>
              Menos pendientes.
              <br />
              Más tranquilidad.
            </h2>
            <p>
              Tu próximo paso no tiene que ser grande.
              <br />
              Solo tiene que ser el siguiente.
            </p>
            <Link to="/actividades">
              Ver mis actividades <ArrowUpRight size={17} />
            </Link>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="floating-note">
              <span className="note-line" />
              <span className="note-check">
                <Check size={28} />
              </span>
              <span className="note-line long" />
              <span className="note-line" />
              <span className="note-tag" />
            </div>
            <span className="spark">✳</span>
            <span className="small-plus">+</span>
          </div>
        </section>
        <Statistics />
        <div className="dashboard-grid">
          <section>
            <div className="section-heading">
              <h2>
                Tu siguiente paso <span>{pending}</span>
              </h2>
              <Link to="/actividades">
                Ver todas <ChevronRight size={16} />
              </Link>
            </div>
            <Cards items={selected} />
          </section>
          <aside className="progress-panel">
            <div className="section-heading">
              <h2>Tu progreso</h2>
              <BarChart3 size={18} />
            </div>
            <div
              className="donut"
              style={{
                background: `conic-gradient(var(--green) ${rate}%, var(--line) 0)`,
              }}
            >
              <div>
                <strong>{rate}%</strong>
                <span>completado</span>
              </div>
            </div>
            <h3>Cada paso cuenta.</h3>
            <p>
              {completed
                ? `Has completado ${completed} de ${tasks.length} actividades. Sigue a tu ritmo.`
                : "Tus logros empiezan con una primera actividad."}
            </p>
            <div className="legend">
              <span>
                <i />
                Completadas
              </span>
              <b>{completed}</b>
            </div>
            <div className="legend">
              <span>
                <i className="muted-dot" />
                Pendientes
              </span>
              <b>{pending}</b>
            </div>
            <div className="local-note">
              <Leaf size={17} />
              <span>
                Tus datos se guardan en este dispositivo, incluso sin conexión.
              </span>
            </div>
          </aside>
        </div>
      </>
    );
  }
  return (
    <div className="app">
      <aside className={`sidebar ${mobile ? "open" : ""}`}>
        <Link className="brand" to="/">
          <span className="brand-mark">
            <CheckCheck size={24} />
          </span>
          TaskFlow<span className="brand-dot">.</span>
        </Link>
        <div className="workspace-label">MI ESPACIO</div>
        <nav>
          {nav.map(([path, label, Icon]) => (
            <NavLink
              end={path === "/"}
              to={path}
              key={path}
              onClick={() => setMobile(false)}
            >
              <Icon size={19} />
              {label}
              {path === "/actividades" && (
                <span className="nav-count">{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="offline-card">
            <span className="offline-symbol">
              <WifiOff size={21} />
            </span>
            <h3>Tu ritmo no se detiene.</h3>
            <p>Consulta y organiza tus actividades incluso sin internet.</p>
            <span>
              <i />
              Siempre contigo
            </span>
          </div>
          <button
            className="install-link"
            onClick={async () => {
              if (install) {
                try {
                  await install.prompt();
                  await install.userChoice;
                  setInstall(null);
                } catch {
                  setInstallHelp(true);
                }
              } else setInstallHelp(true);
            }}
          >
            <Download size={18} />
            Instalar TaskFlow
            <ArrowUpRight size={15} />
          </button>
          <div className="profile">
            <span>TF</span>
            <div>
              <strong>Mi espacio personal</strong>
              <small>Guardado en este dispositivo</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="top-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Abrir menú"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={21} />
            </button>
            <span>Un lugar para tus ideas y tus planes</span>
          </div>
          <div className="top-right">
            <span className={`connection ${!online ? "offline" : ""}`}>
              {online ? <Wifi size={14} /> : <WifiOff size={14} />}{" "}
              {online ? "En línea" : "Sin conexión"}
            </span>
            <span className="top-divider" />
            <Link
              className="icon-button bell"
              to="/configuracion"
              aria-label="Recordatorios"
            >
              <Bell size={19} />
              {prefs.reminders && <i />}
            </Link>
            <button
              className="icon-button"
              aria-label="Cambiar tema"
              onClick={() =>
                preference({
                  theme: prefs.theme === "claro" ? "oscuro" : "claro",
                })
              }
            >
              <Sun size={20} />
            </button>
          </div>
        </header>
        <main>
          {!online && (
            <div className="banner">
              <WifiOff size={17} />
              Estás sin conexión. Puedes seguir trabajando; tus cambios se
              guardan en este dispositivo.
            </div>
          )}
          {needRefresh && (
            <div className="banner">
              Hay una nueva versión disponible.
              <button
                className="button"
                onClick={() => updateServiceWorker(true)}
              >
                Actualizar ahora
              </button>
            </div>
          )}
          {prefs.reminders && overdue.length > 0 && (
            <div className="banner">
              <Bell size={17} />
              {overdue.length} actividades vencidas.{" "}
              <Link to="/actividades">Revisar pendientes</Link>
            </div>
          )}
          {fatal ? (
            <div role="alert" className="empty">
              <h1>El almacenamiento no está disponible</h1>
              <p>
                Permite el almacenamiento del sitio y vuelve a abrir TaskFlow.
                No se han guardado cambios.
              </p>
              <button className="button" onClick={() => location.reload()}>
                Reintentar
              </button>
            </div>
          ) : loading ? (
            <div className="empty" role="status">
              Abriendo tu espacio…
            </div>
          ) : (
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route
                path="/actividades"
                element={<Activities tasks={tasks} Cards={Cards} />}
              />
              <Route
                path="/nueva"
                element={
                  <TaskForm
                    key="new"
                    tasks={tasks}
                    reload={reload}
                    notify={notify}
                    mutate={mutate}
                    fatal={fatal}
                  />
                }
              />
              <Route
                path="/editar/:id"
                element={
                  <TaskForm
                    tasks={tasks}
                    reload={reload}
                    notify={notify}
                    mutate={mutate}
                    fatal={fatal}
                  />
                }
              />
              <Route
                path="/estadisticas"
                element={
                  <>
                    <div className="page-heading">
                      <div>
                        <div className="eyebrow">CADA PASO CUENTA</div>
                        <h1>
                          Tu progreso<span>.</span>
                        </h1>
                        <p>Una mirada a todo lo que estás construyendo.</p>
                      </div>
                    </div>
                    <Statistics />
                    <div className="form-panel">
                      <h2>Actividades por categoría</h2>
                      {categories.map((c) => {
                        const total = tasks.filter(
                            (t) => t.category === c,
                          ).length,
                          done = tasks.filter(
                            (t) => t.category === c && t.completed,
                          ).length;
                        return (
                          <div className="chart-row" key={c}>
                            <div>
                              <span>{c}</span>
                              <strong>
                                {done} / {total} completadas
                              </strong>
                            </div>
                            <progress
                              aria-label={`Progreso ${c}`}
                              value={done}
                              max={total || 1}
                            />
                          </div>
                        );
                      })}
                      <p>{rate}% de todas tus actividades están completadas.</p>
                    </div>
                  </>
                }
              />
              <Route
                path="/configuracion"
                element={
                  <>
                    <div className="page-heading">
                      <div>
                        <div className="eyebrow">A TU MANERA</div>
                        <h1>
                          Configuración<span>.</span>
                        </h1>
                        <p>Un espacio que se adapta a ti.</p>
                      </div>
                    </div>
                    <section className="form-panel">
                      <h2>Apariencia</h2>
                      <label>
                        Tema
                        <select
                          aria-label="Tema"
                          value={prefs.theme}
                          onChange={(e) =>
                            preference({
                              theme: e.target.value as Settings["theme"],
                            })
                          }
                        >
                          <option value="claro">Claro</option>
                          <option value="oscuro">Oscuro</option>
                        </select>
                      </label>
                      <hr />
                      <h2>Recordatorios</h2>
                      <p>
                        Los avisos se comprueban cada 30 segundos mientras
                        TaskFlow está abierta. No se garantizan recordatorios
                        con la aplicación cerrada o suspendida.
                      </p>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={prefs.reminders}
                          onChange={(e) =>
                            preference({ reminders: e.target.checked })
                          }
                        />
                        Mostrar recordatorios de actividades vencidas
                      </label>
                      <p>
                        Permiso del sistema:{" "}
                        <strong>
                          {permission === "granted"
                            ? "concedido"
                            : permission === "denied"
                              ? "denegado"
                              : permission === "default"
                                ? "sin solicitar"
                                : permission}
                        </strong>
                      </p>
                      <button className="button" onClick={requestPermission}>
                        <Bell size={16} />
                        Activar notificaciones del sistema
                      </button>
                      <p className="muted">
                        Si el permiso está denegado, puedes habilitarlo desde
                        los ajustes del sitio en tu navegador. Los avisos
                        internos funcionan sin este permiso.
                      </p>
                      <hr />
                      <h2>Datos y privacidad</h2>
                      <p>
                        Tus actividades y preferencias se almacenan únicamente
                        en IndexedDB de este navegador. No se sincronizan entre
                        dispositivos. Borrar los datos del sitio elimina tus
                        actividades.
                      </p>
                      <p>
                        Versión 1.0 · No se requieren cuentas ni credenciales.
                      </p>
                    </section>
                  </>
                }
              />
              <Route
                path="*"
                element={
                  <div className="empty">
                    <h1>Esta página no existe</h1>
                    <Link to="/">Volver al dashboard</Link>
                  </div>
                }
              />
            </Routes>
          )}
          <footer>
            <span>Hecho para avanzar a tu ritmo.</span>
            <span>
              <Leaf size={13} />
              TaskFlow · Tu día, en orden
            </span>
          </footer>
        </main>
      </div>
      {message && (
        <div className="toast" role="status">
          <CheckCheck size={19} />
          <span>{message}</span>
          <button
            className="icon-button"
            aria-label="Cerrar mensaje"
            onClick={() => setMessage("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {installHelp && (
        <div className="modal-backdrop">
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="install-title"
          >
            <h2 id="install-title">Lleva TaskFlow contigo</h2>
            <p>
              En Chrome o Edge, abre el menú del navegador y busca «Instalar
              TaskFlow» o «Instalar página como aplicación».
            </p>
            <p>
              En iPhone o iPad, abre el sitio en Safari, pulsa Compartir y elige
              «Añadir a pantalla de inicio».
            </p>
            <p>
              La opción depende del navegador y de si ya está instalada. Visita
              el sitio por HTTPS y espera a que termine la primera carga para
              usarlo offline.
            </p>
            <button
              autoFocus
              className="button primary"
              onClick={() => setInstallHelp(false)}
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Activities({
  tasks,
  Cards,
}: {
  tasks: Task[];
  Cards: (props: { items: Task[] }) => React.ReactNode;
}) {
  const [query, setQuery] = useState(""),
    [state, setState] = useState("todas"),
    [priority, setPriority] = useState("todas"),
    [category, setCategory] = useState("todas");
  const filtered = tasks.filter(
    (t) =>
      t.title.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")) &&
      (state === "todas" || t.completed === (state === "completadas")) &&
      (priority === "todas" || t.priority === priority) &&
      (category === "todas" || t.category === category),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">UN PASO A LA VEZ</div>
          <h1>
            Mis actividades<span>.</span>
          </h1>
          <p>Todo lo que quieres hacer, en un solo lugar.</p>
        </div>
        <Link to="/nueva" className="button primary">
          <Plus size={18} />
          Nueva actividad
        </Link>
      </div>
      <div className="filters">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Buscar actividades"
            placeholder="Buscar por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          aria-label="Estado"
          value={state}
          onChange={(e) => setState(e.target.value)}
        >
          <option value="todas">Todos los estados</option>
          <option value="pendientes">Pendientes</option>
          <option value="completadas">Completadas</option>
        </select>
        <select
          aria-label="Prioridad"
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="todas">Todas las prioridades</option>
          {["alta", "media", "baja"].map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <select
          aria-label="Categoría"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="todas">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="section-heading">
        <h2>{filtered.length} actividades</h2>
        <span>Guardado local automático</span>
      </div>
      <Cards items={filtered} />
    </>
  );
}
function TaskForm({
  tasks,
  reload,
  notify,
  mutate,
  fatal,
}: {
  tasks: Task[];
  reload: () => Promise<void>;
  notify: (s: string) => void;
  mutate: (a: () => Promise<unknown>, s: string) => Promise<boolean>;
  fatal: boolean;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const existing = tasks.find((t) => t.id === id);
  const [task, setTask] = useState<Task>(
      existing || {
        id: crypto.randomUUID(),
        title: "",
        description: "",
        category: "Personal",
        priority: "media",
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        due: "",
      },
    ),
    [busy, setBusy] = useState(false),
    [gps, setGps] = useState(false),
    [confirm, setConfirm] = useState(false),
    [error, setError] = useState("");
  if (id && !existing)
    return (
      <div className="empty">
        <h1>Actividad no encontrada</h1>
        <Link to="/actividades">Volver a mis actividades</Link>
      </div>
    );
  const field = (key: keyof Task, value: unknown) =>
    setTask((t) => ({ ...t, [key]: value }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await saveTask(task);
      await reload();
      notify(id ? "Actividad actualizada." : "Actividad creada.");
      navigate("/actividades");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar la actividad.",
      );
    } finally {
      setBusy(false);
    }
  }
  function locate() {
    setError("");
    if (!navigator.geolocation) {
      setError("La geolocalización no está disponible en este navegador.");
      return;
    }
    setGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        field("location", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGps(false);
      },
      (err) => {
        setGps(false);
        setError(
          err.code === 1
            ? "Permiso de ubicación denegado. Puedes habilitarlo en los ajustes del navegador."
            : err.code === 2
              ? "No se pudo obtener la ubicación. Comprueba el GPS."
              : "Se agotó el tiempo para obtener tu ubicación. Inténtalo nuevamente.",
        );
      },
      { timeout: 12000, maximumAge: 60000, enableHighAccuracy: false },
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DALE FORMA A TU PRÓXIMO PASO</div>
          <h1>
            {id ? "Editar actividad" : "Nueva actividad"}
            <span>.</span>
          </h1>
          <p>Los detalles de hoy son la tranquilidad de mañana.</p>
        </div>
      </div>
      <form className="form-panel" onSubmit={submit}>
        <label>
          Título de la actividad
          <input
            autoFocus
            required
            maxLength={120}
            value={task.title}
            onChange={(e) => field("title", e.target.value)}
            placeholder="¿Qué necesitas hacer?"
          />
        </label>
        <label>
          Descripción
          <textarea
            maxLength={4000}
            rows={4}
            value={task.description}
            onChange={(e) => field("description", e.target.value)}
            placeholder="Añade los detalles que te ayuden a empezar…"
          />
        </label>
        <div className="form-row">
          <label>
            Categoría
            <select
              aria-label="Categoría"
              value={task.category}
              onChange={(e) => field("category", e.target.value)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Prioridad
            <select
              aria-label="Prioridad"
              value={task.priority}
              onChange={(e) => field("priority", e.target.value)}
            >
              {["alta", "media", "baja"].map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Fecha y hora límite <span className="optional">(opcional)</span>
          <input
            type="datetime-local"
            value={task.due}
            onChange={(e) => field("due", e.target.value)}
          />
        </label>
        <div className="location-box">
          <div>
            <h3>
              <MapPin size={18} />
              Ubicación <span className="optional">opcional</span>
            </h3>
            <p>
              Asocia tu ubicación actual. Las coordenadas se conservarán sin
              conexión.
            </p>
            {task.location && (
              <p className="coordinates">
                {task.location.latitude.toFixed(6)},{" "}
                {task.location.longitude.toFixed(6)} · precisión ±
                {Math.round(task.location.accuracy)} m
              </p>
            )}
          </div>
          <button
            type="button"
            className="button"
            disabled={gps}
            onClick={locate}
          >
            <MapPin size={16} />
            {gps ? "Obteniendo…" : "Usar mi ubicación"}
          </button>
          {task.location && (
            <button
              className="icon-button"
              type="button"
              onClick={() => field("location", undefined)}
              aria-label="Quitar ubicación"
            >
              <X size={18} />
            </button>
          )}
        </div>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="form-actions">
          {id && (
            <button
              type="button"
              className="button danger"
              onClick={() => setConfirm(true)}
            >
              <Trash2 size={16} />
              Eliminar
            </button>
          )}
          <Link className="button" to="/actividades">
            Cancelar
          </Link>
          <button className="button primary" disabled={busy || fatal}>
            {busy ? "Guardando…" : "Guardar actividad"}
          </button>
        </div>
        {confirm && (
          <div className="modal-backdrop">
            <div
              className="modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-title"
            >
              <h2 id="delete-title">¿Eliminar esta actividad?</h2>
              <p>
                Se eliminará «{task.title}». Esta acción no se puede deshacer.
              </p>
              <div className="form-actions">
                <button
                  className="button"
                  type="button"
                  autoFocus
                  onClick={() => setConfirm(false)}
                >
                  Conservar
                </button>
                <button
                  type="button"
                  className="button danger"
                  onClick={async () => {
                    if (
                      await mutate(
                        () => db.tasks.delete(task.id),
                        "Actividad eliminada.",
                      )
                    )
                      navigate("/actividades");
                  }}
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </>
  );
}
