import { useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { c } from "@/theme";

type Props = {
  on_close?: () => void;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  width?: number;
  z?: number;
  portal?: boolean;
  panel_style?: React.CSSProperties;
};

const CLOSE_MS = 200;

export function Modal({ on_close, children, width = 420, z = 10000, portal, panel_style }: Props) {
  const [closing, set_closing] = useState(false);
  const on_close_ref = useRef(on_close);
  on_close_ref.current = on_close;

  const close = useCallback(() => {
    if (closing) return;
    set_closing(true);
    setTimeout(() => on_close_ref.current?.(), CLOSE_MS);
  }, [closing]);

  const noop = useCallback(() => {}, []);

  const content = (
    <div
      onClick={on_close ? close : undefined}
      style={{
        position: "fixed", inset: 0, zIndex: z,
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: c.b35,
        animation: closing
          ? `modal-bg-out ${CLOSE_MS}ms ease-in forwards`
          : "modal-bg-in 0.25s ease-out forwards",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width, padding: "32px 36px",
          borderRadius: 18,
          background: c.modal,
          border: `1px solid ${c.w08}`,
          boxShadow: `0 24px 80px ${c.b70}`,
          animation: closing
            ? `modal-panel-out ${CLOSE_MS}ms ease-in forwards`
            : "modal-panel-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          ...panel_style,
        }}
      >
        {typeof children === "function" ? children(on_close ? close : noop) : children}
      </div>
    </div>
  );

  return portal ? createPortal(content, document.body) : content;
}
