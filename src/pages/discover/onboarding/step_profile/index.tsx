import { useState, useRef } from "react";
import { Camera, User } from "lucide-react";
import { use_profile } from "@/ctx";
import { c } from "@/theme";

type Props = { on_done: () => void };

export function StepProfile({ on_done }: Props) {
  const { name, avatar, set_name, set_avatar, finish_onboarding } = use_profile();
  const [input, set_input] = useState(name);
  const [hov_avatar, set_hov_avatar] = useState(false);
  const file_ref = useRef<HTMLInputElement>(null);

  function handle_file(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set_avatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function finish() {
    if (input.trim()) set_name(input.trim());
    finish_onboarding();
    on_done();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", padding: "0 64px", gap: 40 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <h2 style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.5px", lineHeight: 1.05, color: c.text, margin: 0 }}>
          What should we<br />call you?
        </h2>
        <p style={{ fontSize: 15, color: c.w40, lineHeight: 1.65, maxWidth: 340, fontWeight: 400, margin: 0 }}>
          Add your name and a photo to personalise your experience.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <button
          onClick={() => file_ref.current?.click()}
          onMouseEnter={() => set_hov_avatar(true)}
          onMouseLeave={() => set_hov_avatar(false)}
          style={{
            alignSelf: "flex-start",
            position: "relative", width: 72, height: 72, borderRadius: "50%",
            background: c.w06,
            border: `1.5px solid ${hov_avatar ? c.w30 : c.w10}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", transition: "border-color 0.15s",
          }}
        >
          {avatar ? (
            <>
              <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              {hov_avatar && (
                <div style={{ position: "absolute", inset: 0, background: c.b50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Camera size={18} color={c.white} />
                </div>
              )}
            </>
          ) : (
            hov_avatar
              ? <Camera size={22} color={c.w50} />
              : <User size={22} color={c.w20} />
          )}
        </button>
        <input ref={file_ref} type="file" accept="image/*" style={{ display: "none" }} onChange={handle_file} />

        <input
          value={input}
          onChange={e => set_input(e.target.value)}
          onKeyDown={e => e.key === "Enter" && input.trim() && finish()}
          placeholder="Your name…"
          style={{
            width: 260, padding: "12px 18px", borderRadius: 10, fontSize: 15, fontWeight: 500,
            background: c.w06, border: `1px solid ${c.w10}`,
            color: c.text, outline: "none",
            transition: "border-color 0.15s, background 0.15s",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = c.accent_45; e.currentTarget.style.background = c.w09; }}
          onBlur={e => { e.currentTarget.style.borderColor = c.w10; e.currentTarget.style.background = c.w06; }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <button
          onClick={finish}
          disabled={!input.trim()}
          style={{ alignSelf: "flex-start", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, background: c.accent, color: c.white, opacity: input.trim() ? 1 : 0.35, transition: "opacity 0.12s" }}
          onMouseEnter={e => { if (input.trim()) e.currentTarget.style.opacity = "0.82"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = input.trim() ? "1" : "0.35"; }}
        >
          Start Listening
        </button>
        <button
          onClick={() => { finish_onboarding(); on_done(); }}
          style={{ alignSelf: "flex-start", fontSize: 13, color: c.w25, transition: "color 0.15s", background: "none", border: "none", padding: 0 }}
          onMouseEnter={e => (e.currentTarget.style.color = c.w50)}
          onMouseLeave={e => (e.currentTarget.style.color = c.w25)}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
