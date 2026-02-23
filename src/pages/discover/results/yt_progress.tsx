import { c } from "@/theme";

type Props = {
  progress: { phase: string; done: number; total: number; title: string } | null;
};

export function YtProgress({ progress }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: 32 }}>
      {progress?.phase === "fetching" && (
        <p style={{ fontSize: 13, color: c.w50 }}>Fetching playlist...</p>
      )}
      {progress?.phase === "covers" && progress.total > 0 && (
        <>
          <p style={{ fontSize: 13, color: c.w50 }}>
            Looking up track {progress.done} / {progress.total}
          </p>
          <div style={{ width: 200, height: 4, borderRadius: 2, background: c.w10, overflow: "hidden" }}>
            <div style={{
              width: `${Math.round((progress.done / progress.total) * 100)}%`,
              height: "100%", borderRadius: 2, background: c.youtube,
              transition: "width 0.2s ease",
            }} />
          </div>
          {progress.title && (
            <p style={{ fontSize: 12, color: c.w30, maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {progress.title}
            </p>
          )}
        </>
      )}
      {!progress && (
        <div style={{ display: "flex", gap: 6 }} className="dot-bounce">
          <span /><span /><span />
        </div>
      )}
    </div>
  );
}
