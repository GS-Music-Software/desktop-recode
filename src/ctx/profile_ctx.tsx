import { createContext, useContext, useState, type ReactNode } from "react";

type ProfileState = {
  name: string;
  avatar: string | null;
  set_name: (n: string) => void;
  set_avatar: (url: string | null) => void;
  onboarding_done: boolean;
  finish_onboarding: () => void;
  reset: () => void;
};

const Ctx = createContext<ProfileState | null>(null);

export function ProfileProv({ children }: { children: ReactNode }) {
  const [name, _set_name] = useState(() => localStorage.getItem("profile_name") ?? "");
  const [avatar, _set_avatar] = useState<string | null>(() => localStorage.getItem("profile_avatar"));
  const [onboarding_done, set_done] = useState(() => localStorage.getItem("onboarding_done") === "1");

  function set_name(n: string) {
    localStorage.setItem("profile_name", n);
    _set_name(n);
  }

  function set_avatar(url: string | null) {
    if (url) localStorage.setItem("profile_avatar", url);
    else localStorage.removeItem("profile_avatar");
    _set_avatar(url);
  }

  function finish_onboarding() {
    localStorage.setItem("onboarding_done", "1");
    set_done(true);
  }

  function reset() {
    localStorage.removeItem("onboarding_done");
    localStorage.removeItem("profile_name");
    localStorage.removeItem("profile_avatar");
    localStorage.removeItem("music_dir");
    localStorage.removeItem("server_url");
    localStorage.removeItem("library_mode");
    _set_name("");
    _set_avatar(null);
    set_done(false);
  }

  return (
    <Ctx.Provider value={{ name, avatar, set_name, set_avatar, onboarding_done, finish_onboarding, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function use_profile(): ProfileState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("use_profile outside provider");
  return ctx;
}
