import { useRef } from "react";
import { Search, Loader, ChevronLeft } from "lucide-react";
import { c } from "@/theme";

type Props = {
  query: string;
  set_query: (q: string) => void;
  searching: boolean;
  has_drill: boolean;
  on_search: () => void;
  on_back: () => void;
};

export function SearchHeader({ query, set_query, searching, has_drill, on_search, on_back }: Props) {
  const input_ref = useRef<HTMLInputElement>(null);

  return (
    <div
      className="page-header"
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        flexShrink: 0,
        gap: 14,
      }}
      data-tauri-drag-region
    >
      {has_drill ? (
        <button
          onClick={on_back}
          style={{
            color: c.w50,
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 13,
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = c.white)}
          onMouseLeave={(e) => (e.currentTarget.style.color = c.w50)}
        >
          <ChevronLeft size={16} />
          Back
        </button>
      ) : (
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            color: c.text,
            flexShrink: 0,
          }}
        >
          Discover
        </h1>
      )}
      <div
        style={{
          flex: 1,
          maxWidth: 480,
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: c.w05,
          borderRadius: 12,
          padding: "0 14px",
          border: `1px solid ${c.w06}`,
        }}
      >
        <Search size={14} color={c.w30} style={{ flexShrink: 0 }} />
        <input
          ref={input_ref}
          value={query}
          onChange={(e) => set_query(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && on_search()}
          placeholder="Search songs, artists, albums..."
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: c.text,
            fontSize: 13,
            padding: "9px 0",
          }}
        />
        {searching && (
          <Loader
            size={14}
            color={c.w30}
            style={{ flexShrink: 0, animation: "spin 0.8s linear infinite" }}
          />
        )}
      </div>
      <button
        onClick={on_search}
        style={{
          padding: "8px 18px",
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          background: c.accent,
          color: c.white,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
      >
        Search
      </button>
    </div>
  );
}
