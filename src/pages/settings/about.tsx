import { useState } from "react";
import { use_lib } from "@/ctx";
import { ChevronLeft } from "lucide-react";
import gs_icon from "@/assets/gs_icon.webp";
import { c } from "@/theme";
import { PEOPLE, DEPS, type Person } from "@/data/about";

function PersonCard({ p }: { p: Person }) {
  const [hov, set_hov] = useState(false);

  return (
    <a
      href={p.url}
      target="_blank"
      rel="noreferrer"
      onMouseEnter={() => set_hov(true)}
      onMouseLeave={() => set_hov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "16px 20px",
        borderRadius: 12,
        background: hov ? c.w07 : c.w04,
        border: `1px solid ${c.w07}`,
        textDecoration: "none",
        transition: "background 0.15s",
      }}
    >
      <img
        src={p.avatar}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          border: `1.5px solid ${c.w10}`,
        }}
      />
      <div>
        <p style={{ fontSize: 15, fontWeight: 600, color: c.text }}>
          {p.name}
        </p>
        <p
          style={{ fontSize: 12, color: c.w40, marginTop: 2 }}
        >
          @{p.handle}
        </p>
      </div>
    </a>
  );
}

export function About() {
  const { set_view } = use_lib();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          padding: "0 16px 0 8px",
          gap: 4,
          flexShrink: 0,
          borderBottom: `1px solid ${c.w07}`,
        }}
      >
        <button
          onClick={() => set_view("settings")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "6px 10px",
            borderRadius: 8,
            color: c.w50,
            fontSize: 13,
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = c.text)}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = c.w50)
          }
        >
          <ChevronLeft size={16} />
          Settings
        </button>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: c.text,
            marginLeft: 4,
          }}
        >
          About
        </h1>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        <div
          style={{
            maxWidth: 520,
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img
              src={gs_icon}
              style={{ width: 64, height: 64, borderRadius: 16, flexShrink: 0 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <p
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: "-0.5px",
                  color: c.text,
                }}
              >
                GS Music
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: c.w40,
                  lineHeight: 1.6,
                  maxWidth: 360,
                }}
              >
                A local music player with discovery and downloads, built with
                Tauri and React.
              </p>
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: c.w35,
                marginBottom: 14,
              }}
            >
              Made by
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {PEOPLE.map((p) => (
                <PersonCard key={p.handle} p={p} />
              ))}
            </div>
          </div>

          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: c.w35,
                marginBottom: 14,
              }}
            >
              Dependencies
            </p>
            <div
              style={{
                borderRadius: 12,
                overflow: "hidden",
                border: `1px solid ${c.w07}`,
              }}
            >
              {DEPS.map((d, i) => (
                <a
                  key={d.name}
                  href={d.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    textDecoration: "none",
                    background: c.w04,
                    borderTop:
                      i > 0 ? `1px solid ${c.w06}` : "none",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background =
                      c.w07)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      c.w04)
                  }
                >
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: c.text,
                      }}
                    >
                      {d.name}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: c.w40,
                        marginTop: 2,
                      }}
                    >
                      {d.desc}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
