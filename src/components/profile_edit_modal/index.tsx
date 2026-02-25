import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { use_profile } from "@/ctx";
import { c } from "@/theme";
import { AvatarPicker } from "./avatar_picker";
import { AvatarCrop } from "./avatar_crop";

type Props = {
  on_close: () => void;
};

export function ProfileEditModal({ on_close }: Props) {
  const { name, avatar, set_name, set_avatar } = use_profile();
  const [draft_name, set_draft_name] = useState(name);
  const [preview_src, set_preview_src] = useState<string | null>(avatar);
  const [cleared, set_cleared] = useState(false);
  const [crop_src, set_crop_src] = useState<string | null>(null);

  const handle_pick = (path: string) => {
    invoke<string | null>("pl_cover", { path })
      .then(data_uri => { if (data_uri) set_crop_src(data_uri); })
      .catch(() => {});
  };

  const handle_crop_apply = (data_url: string) => {
    set_preview_src(data_url);
    set_cleared(false);
    set_crop_src(null);
  };

  const handle_clear = () => {
    set_preview_src(null);
    set_cleared(true);
  };

  const handle_save = () => {
    set_name(draft_name.trim());
    if (cleared) {
      set_avatar(null);
    } else if (preview_src && preview_src !== avatar) {
      set_avatar(preview_src);
    }
    on_close();
  };

  return (
    <>
      <div onClick={on_close} style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: c.b35,
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          width: 420, padding: "32px 36px",
          borderRadius: 18,
          background: c.modal,
          border: `1px solid ${c.w08}`,
          boxShadow: `0 24px 80px ${c.b70}`,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: c.text, marginBottom: 20 }}>Edit Profile</h2>

          <div style={{ display: "flex", gap: 16, marginBottom: 16, alignItems: "center" }}>
            <AvatarPicker src={preview_src} on_pick={handle_pick} on_clear={handle_clear} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <input
                value={draft_name}
                onChange={e => set_draft_name(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handle_save()}
                placeholder="Display name"
                autoFocus
                style={{
                  width: "100%", padding: "10px 12px",
                  borderRadius: 8, fontSize: 13,
                  background: c.w06,
                  border: `1px solid ${c.w10}`,
                  color: c.text, outline: "none",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={on_close} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: c.w06, color: c.w50,
              transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = c.w10)}
              onMouseLeave={e => (e.currentTarget.style.background = c.w06)}
            >Cancel</button>
            <button onClick={handle_save} style={{
              padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500,
              background: c.accent, color: c.white,
              transition: "opacity 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >Save</button>
          </div>
        </div>
      </div>

      {crop_src && (
        <AvatarCrop
          src={crop_src}
          on_apply={handle_crop_apply}
          on_cancel={() => set_crop_src(null)}
        />
      )}
    </>
  );
}
