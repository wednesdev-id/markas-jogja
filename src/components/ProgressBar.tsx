import { C } from "@/lib/utils";

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ height: 8, background: "#EDEFF3", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: pct === 100 ? C.daun : C.kunyit, borderRadius: 99, transition: "width .3s" }} />
      </div>
      <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 3, textAlign: "right" }}>{pct}%</div>
    </div>
  );
}
