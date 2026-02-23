import { useState } from "react";
import { use_lib } from "@/ctx";
import { Search } from "lucide-react";
import { c } from "@/theme";

export function SearchBar() {
  const { search, set_search } = use_lib();
  const [foc, set_foc] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        value={search}
        onChange={(e) => set_search(e.target.value)}
        onFocus={() => set_foc(true)}
        onBlur={() => set_foc(false)}
        placeholder="Search"
        style={{
          width: 200,
          height: 30,
          paddingLeft: 30,
          paddingRight: 12,
          borderRadius: 8,
          fontSize: 13,
          outline: "none",
          background: c.w07,
          border: foc ? `1px solid ${c.w20}` : `1px solid ${c.w08}`,
          color: c.text,
          transition: "border 0.15s",
        }}
      />
      <Search size={14} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: c.w35, pointerEvents: "none" }} />
    </div>
  );
}
