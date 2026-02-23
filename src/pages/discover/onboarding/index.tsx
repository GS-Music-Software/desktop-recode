import { useState, useEffect, useRef } from "react";
import { StepWelcome } from "./step_welcome";
import { StepFolder } from "./step_folder";
import { StepMigrate } from "./step_migrate";
import { StepProfile } from "./step_profile";
import { c } from "@/theme";

type Step = "welcome" | "folder" | "migrate" | "profile";
const STEPS: Step[] = ["welcome", "folder", "migrate", "profile"];

function Bg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden", background: c.bg }}>
      <div style={{
        position: "absolute", inset: "-20%",
        background: "conic-gradient(from 200deg at 35% 60%, #fc3c44 0deg, #8b0010 60deg, #09090b 120deg, #09090b 240deg, #3d0020 300deg, #fc3c44 360deg)",
        filter: "blur(90px) saturate(1.4) brightness(0.28)",
        transform: "scale(1.1)",
      }} />
      <div style={{ position: "absolute", inset: 0, background: c.b72 }} />
    </div>
  );
}

type Props = { on_done: () => void };

export function Onboarding({ on_done }: Props) {
  const [step, set_step] = useState<Step>("welcome");
  const [exiting, set_exiting] = useState(false);
  const next_step = useRef<Step | null>(null);

  function go_to(s: Step) {
    if (exiting) return;
    next_step.current = s;
    set_exiting(true);
  }

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => {
      if (next_step.current) set_step(next_step.current);
      set_exiting(false);
    }, 320);
    return () => clearTimeout(t);
  }, [exiting]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", overflow: "hidden" }}>
      <Bg />
      <div style={{ position: "relative", zIndex: 1, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ height: 52, flexShrink: 0 }} data-tauri-drag-region />
        <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
          <div key={step} className={exiting ? "ob-exit-fwd" : "ob-enter-fwd"} style={{ height: "100%" }}>
            {step === "welcome" && <StepWelcome on_next={() => go_to("folder")} />}
            {step === "folder" && <StepFolder on_next={() => go_to("migrate")} />}
            {step === "migrate" && <StepMigrate on_next={() => go_to("profile")} />}
            {step === "profile" && <StepProfile on_done={on_done} />}
          </div>
        </div>
        <div style={{ height: 48, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          {STEPS.map(s => (
            <div key={s} style={{
              width: s === step ? 18 : 4, height: 4, borderRadius: 2,
              background: s === step ? c.accent : c.w15,
              transition: "width 0.4s cubic-bezier(0.4,0,0.2,1), background 0.4s",
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
