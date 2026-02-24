import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LibProv, PlProv, SettingsProv, ToastProv, ProfileProv, ThemeProv } from "@/ctx";
import { App } from "./app";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProv>
      <ProfileProv>
        <ToastProv>
          <SettingsProv>
            <LibProv>
              <PlProv>
                <App />
              </PlProv>
            </LibProv>
          </SettingsProv>
        </ToastProv>
      </ProfileProv>
    </ThemeProv>
  </StrictMode>
);
