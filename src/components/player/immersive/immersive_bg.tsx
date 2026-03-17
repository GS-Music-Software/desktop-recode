type props = {
  cover_url: string | null;
  playing: boolean;
};

export function ImmersiveBg({ cover_url, playing }: props) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
        transform: "translateZ(0px)",
      }}
    >
      <img
        src={cover_url || ""}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "200%",
          height: "200%",
          filter: "brightness(100%) blur(80px) saturate(150%) contrast(1.2)",
          opacity: 0.8,
          animation: playing ? "rotate_bg 35s linear infinite" : "none",
          backgroundPosition: "center",
          objectFit: "cover",
        }}
      />
      <img
        src={cover_url || ""}
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: "200%",
          height: "200%",
          filter: "brightness(95%) blur(80px) saturate(140%) contrast(1.1)",
          opacity: 0.6,
          animation: playing ? "rotate_bg 35s linear infinite reverse" : "none",
          animationDelay: "10s",
          backgroundPosition: "center",
          objectFit: "cover",
        }}
      />
      <style>{`
        @keyframes rotate_bg {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
