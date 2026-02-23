import { c } from "@/theme";

export function Backdrop({ cover }: { cover: string | null }) {
  return (
    <div style={{ position: "absolute", inset: 0, background: c.bg_dark }}>
      {cover && (
        <>
          <img
            src={cover}
            style={{
              position: "absolute",
              inset: "-30%",
              width: "160%",
              height: "160%",
              objectFit: "cover",
              filter: "blur(70px) saturate(1.8) brightness(0.22)",
            }}
          />
          <img
            src={cover}
            style={{
              position: "absolute",
              width: "75%",
              height: "75%",
              top: "-20%",
              left: "-15%",
              objectFit: "cover",
              borderRadius: "50%",
              filter: "blur(90px) saturate(2.4) brightness(0.32)",
              animation: "blob1 20s ease-in-out infinite",
            }}
          />
          <img
            src={cover}
            style={{
              position: "absolute",
              width: "70%",
              height: "70%",
              bottom: "-20%",
              right: "-15%",
              objectFit: "cover",
              borderRadius: "50%",
              filter: "blur(100px) saturate(2.6) brightness(0.28)",
              animation: "blob2 25s ease-in-out infinite",
            }}
          />
          <img
            src={cover}
            style={{
              position: "absolute",
              width: "55%",
              height: "55%",
              top: "20%",
              right: "5%",
              objectFit: "cover",
              borderRadius: "50%",
              filter: "blur(85px) saturate(2) brightness(0.22)",
              animation: "blob3 30s ease-in-out infinite",
            }}
          />
        </>
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: c.b45,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 80% at 20% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </div>
  );
}
