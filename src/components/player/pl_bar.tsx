import { useState } from "react";
import { c } from "@/theme";
import { PlInfo } from "./pl_info";
import { PlCtrl } from "./pl_ctrl";
import { PlVol } from "./pl_vol";
import { Immersive } from "./immersive";
import { QueuePanel } from "./queue_panel";
import { use_pl } from "@/ctx";

export function PlBar() {
  const { current } = use_pl();
  const [iv, set_iv] = useState(false);
  const [q_open, set_q_open] = useState(false);

  return (
    <>
      <QueuePanel open={q_open} on_close={() => set_q_open(false)} />
      <div className="pl-bar" style={{ height: 80, minHeight: 80, display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0, background: c.surface, borderTop: `1px solid ${c.w07}`, position: "relative" }}>
        <PlInfo on_expand={current ? () => set_iv(true) : undefined} />
        <PlCtrl />
        <PlVol on_queue={() => set_q_open(p => !p)} />
      </div>
      <Immersive open={iv} on_close={() => set_iv(false)} />
    </>
  );
}
