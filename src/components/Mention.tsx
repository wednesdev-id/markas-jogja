import { C } from "@/lib/utils";

export function Mention({ text }: { text: string }) {
  const parts = String(text || "").split(/(@[A-Za-z0-9_]+)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("@") ? (
          <span key={i} style={{ color: C.kunyit, fontWeight: 700, background: "#FCF3D7", borderRadius: 4, padding: "0 3px" }}>{p}</span>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}
