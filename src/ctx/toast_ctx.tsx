import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";

export type ToastType = "progress" | "success" | "error";

export type Toast = {
  id: string;
  type: ToastType;
  title: string;
  sub?: string;
  pct?: number;
  cover_url?: string;
};

type ToastCtx = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id"> & { id?: string }) => string;
  update: (id: string, patch: Partial<Toast>) => void;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProv({ children }: { children: ReactNode }) {
  const [toasts, set_toasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    set_toasts(prev => prev.filter(t => t.id !== id));
    const t = timers.current.get(id);
    if (t) { clearTimeout(t); timers.current.delete(id); }
  }, []);

  const push = useCallback((t: Omit<Toast, "id"> & { id?: string }): string => {
    const id = t.id ?? `toast_${Date.now()}_${Math.random()}`;
    set_toasts(prev => {
      const exists = prev.find(x => x.id === id);
      if (exists) return prev.map(x => x.id === id ? { ...x, ...t, id } : x);
      return [...prev, { ...t, id }];
    });
    const existing_timer = timers.current.get(id);
    if (existing_timer) { clearTimeout(existing_timer); timers.current.delete(id); }
    if (t.type === "success" || t.type === "error") {
      const timer = setTimeout(() => dismiss(id), t.type === "error" ? 6000 : 4000);
      timers.current.set(id, timer);
    }
    return id;
  }, [dismiss]);

  const update = useCallback((id: string, patch: Partial<Toast>) => {
    set_toasts(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
    if (patch.type === "success" || patch.type === "error") {
      const existing = timers.current.get(id);
      if (existing) clearTimeout(existing);
      const timer = setTimeout(() => dismiss(id), patch.type === "error" ? 6000 : 4000);
      timers.current.set(id, timer);
    }
  }, [dismiss]);

  return (
    <Ctx.Provider value={{ toasts, push, update, dismiss }}>
      {children}
    </Ctx.Provider>
  );
}

export function use_toast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("use_toast outside provider");
  return ctx;
}
